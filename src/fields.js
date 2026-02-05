class Field {
  constructor({
    required = true,
    defaultValue,
    validators = [],
    contextRule,
    writeOnly = false,
    readOnly = false,
  } = {}) {
    this.required = required;
    this.defaultValue = defaultValue;
    this.validators = validators;
    this.contextRule = contextRule;
    this._writeOnly = writeOnly;
    this._readOnly = readOnly;
  }

  bind(parentSerializer, fieldName) {
    this.parent = parentSerializer;
    this.fieldName = fieldName;
  }

  checkType(value) {
    return true;
  }

  serialize(value, ctx = {}, parentSerializer, path, mode, root) {
    if (mode === "input" && this._readOnly) return { skip: true };
    if (mode === "output" && this._writeOnly) return { skip: true };

    // context-aware exclusion
    if (this.contextRule && !this.contextRule(ctx)) return { skip: true };

    if (!value) {
      if (this.defaultValue !== undefined) {
        if (typeof this.defaultValue === "function") {
          return {
            value: this.defaultValue(value, root, ctx),
          };
        }
        return { value: this.defaultValue };
      }
      if (this.required && mode !== "output")
        parentSerializer?._addError(path, "Field is required");
      return { skip: true };
    }

    // type check
    if (!this.checkType(value)) {
      parentSerializer?._addError(path, `Invalid ${this.constructor.name}`);
      return { skip: true };
    }

    // validators
    for (const validator of this.validators) {
      const result = validator(value, ctx);
      if (result !== true)
        parentSerializer?._addError(path, result || "Validation failed");
    }

    return { value };
  }

  writeOnly() {
    this._writeOnly = true;
    return this;
  }

  readOnly() {
    this._readOnly = true;
    return this;
  }

  optional() {
    this.required = false;
    return this;
  }

  default(value) {
    this.defaultValue = value;
    return this;
  }

  validate(fn) {
    this.validators.push(fn);
    return this;
  }

  onlyIf(fn) {
    this.contextRule = fn;
    return this;
  }
}

class CharField extends Field {
  checkType(value) {
    return typeof value === "string";
  }

  enumOptions(values) {
    this.validate(
      (v) => values.includes(v) || `Must be one of: ${values.join(", ")}`,
    );
    return this;
  }

  minLength(length) {
    this.validate((v) =>
      typeof v === "string" && v.length >= length
        ? true
        : `Minimum length is ${length}`,
    );
    return this;
  }

  maxLength(length) {
    this.validate((v) =>
      typeof v === "string" && v.length <= length
        ? true
        : `Maximum length is ${length}`,
    );
    return this;
  }
}

class NumberField extends Field {
  checkType(value) {
    return typeof value === "number";
  }

  min(value) {
    this.validate((v) =>
      typeof v === "number" && v >= value ? true : `Must be ≥ ${value}`,
    );
    return this;
  }

  max(value) {
    this.validate((v) =>
      typeof v === "number" && v <= value ? true : `Must be ≤ ${value}`,
    );
    return this;
  }
}

class IntegerField extends NumberField {
  checkType(value) {
    return Number.isInteger(value);
  }
}

class BooleanField extends Field {
  checkType(value) {
    return typeof value === "boolean";
  }
}

class DateTimeField extends Field {
  checkType(value) {
    return value instanceof Date;
  }
}

class DateField extends DateTimeField {}
class EmailField extends CharField {}
class UrlField extends CharField {}

class ObjectField extends Field {
  constructor(serializer) {
    super();
    if (!serializer || typeof serializer.serialize !== "function") {
      throw new Error("ObjectField expects a Serializer instance");
    }
    this.serializer = serializer;
  }

  checkType(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  serialize(value, ctx, parentSerializer, path, mode, root) {
    const base = super.serialize(
      value,
      ctx,
      parentSerializer,
      path,
      mode,
      root,
    );
    if (base.skip) return base;

    const nested = this.serializer.serialize(value, ctx);
    // Merge nested errors
    for (const err in nested.errors) {
      parentSerializer?._addError(`${path}.${err}`, nested.errors[err]);
    }

    return { value: nested.data };
  }
}

class JsonField extends Field {
  constructor() {
    super();
  }

  checkType(value) {
    return typeof value === "object" && value !== null;
  }

  serialize(value, ctx, parentSerializer, path, mode = "both", root) {
    const base = super.serialize(
      value,
      ctx,
      parentSerializer,
      path,
      mode,
      root,
    );
    if (base.skip) return base;

    return { value: base.value };
  }
}

class ArrayField extends Field {
  constructor(child) {
    super();
    this.child = child;
    this.serializer = null;
  }

  bind(parentSerializer, fieldName) {
    super.bind(parentSerializer, fieldName);

    // If child is a Serializer
    if (this.child && this.child.schema) {
      this.serializer = this.child;
    }

    // If child is a Field
    else if (this.child instanceof Field) {
      this.child.bind?.(parentSerializer, fieldName);
    }
  }

  checkType(value) {
    return Array.isArray(value);
  }

  serialize(value, ctx, parentSerializer, path, mode, root) {
    const base = super.serialize(
      value,
      ctx,
      parentSerializer,
      path,
      mode,
      root,
    );
    if (base.skip) return base;

    if (!Array.isArray(value)) {
      parentSerializer?._addError(path, "Expected array");
      return { skip: true };
    }

    const out = [];

    value.forEach((item, i) => {
      if (this.serializer) {
        const nested = this.serializer.serialize(item, ctx);

        if (nested.errors) {
          for (const err in nested.errors) {
            parentSerializer?._addError(
              `${path}[${i}].${err}`,
              nested.errors[err],
            );
          }
        }

        out.push(nested.data);
      } else {
        const res = this.child.serialize(
          item,
          ctx,
          parentSerializer,
          `${path}[${i}]`,
        );

        if (!res.skip && res.value !== undefined) {
          out.push(res.value);
        }
      }
    });

    return { value: out };
  }
}

module.exports = {
  CharField,
  NumberField,
  IntegerField,
  BooleanField,
  DateTimeField,
  DateField,
  EmailField,
  UrlField,
  ArrayField,
  ObjectField,
  JsonField,
};
