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

  serialize(value, ctx = {}, parentSerializer, path, mode = "both") {
    if (mode === "input" && this.readOnly) return { skip: true };
    if (mode === "output" && this.writeOnly) return { skip: true };

    // context-aware exclusion
    if (this.contextRule && !this.contextRule(ctx)) return { skip: true };

    if (value === undefined) {
      if (this.defaultValue !== undefined) return { value: this.defaultValue };
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
}

class NumberField extends Field {
  checkType(value) {
    return typeof value === "number";
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

  serialize(value, ctx, parentSerializer, path) {
    const base = super.serialize(value, ctx, parentSerializer, path);
    if (base.skip) return base;

    const nested = this.serializer.serialize(value, ctx);
    // Merge nested errors
    for (const err in nested.errors) {
      parentSerializer?._addError(`${path}.${err}`, nested.errors[err]);
    }

    return { value: nested.data };
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

  serialize(value, ctx, parentSerializer, path) {
    const base = super.serialize(value, ctx, parentSerializer, path);
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
};
