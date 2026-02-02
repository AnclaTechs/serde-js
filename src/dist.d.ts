export interface ValidatorFn<T = any> {
  (value: T, context?: any): boolean | string
}

export interface ContextRuleFn {
  (context: any): boolean
}

export interface SerializeResult {
  value?: any
  skip?: boolean
}

export type Mode = "input" | "output" | "both"

export interface DefaultFn<T = any> {
  (value: T | undefined, root: Record<string, any>, context?: any): T;
}

export declare class Field {
  required: boolean
  defaultValue?: any | DefaultFn
  validators: ValidatorFn[]
  contextRule?: ContextRuleFn
  writeOnly?: boolean
  readOnly?: boolean

  optional(): this
  default(value: any | DefaultFn): this
  validate(fn: ValidatorFn): this
  onlyIf(fn: ContextRuleFn): this
  checkType(value: any): boolean
  writeOnly(): this
  readOnly(): this
  serialize(
    value: any,
    context?: any,
    serializer?: Serializer,
    path?: string,
    mode?: Mode
  ): SerializeResult
}

export declare class CharField extends Field {
  enumOptions(values: string[]): this
  minLength(length: number): this
  maxLength(length: number): this
}

export declare class NumberField extends Field {
  min(value: number): this
  max(value: number): this
}
export declare class IntegerField extends Field {
  min(value: number): this
  max(value: number): this
}
export declare class BooleanField extends Field {}
export declare class DateTimeField extends Field {}
export declare class DateField extends Field {}
export declare class EmailField extends CharField {}
export declare class UrlField extends CharField {}
export declare class ArrayField extends Field {
  child: Field | Serializer
  constructor(child: Field | Serializer)
}
export declare class ObjectField extends Field {
  serializer: Serializer
  constructor(serializer: Serializer)
}

export interface SerializeOptions {
  mode?: Mode;
  context?: any;
  many?: boolean;
}

export interface SerializedOutput {
  data: any;
  errors: Record<string, string>;
  isValid(): boolean;
  firstError(): string | null;
  verboseErrorList(): { path: string; message: string }[];
}

export declare class Serializer {
  schema: Record<string, Field>

  constructor(schema: Record<string, Field>, options?: SerializerOptions);

  serialize(input: any, options?: { mode?: Mode; many?: boolean, context?: any }):  SerializedOutput;
  //_serializeItem(item: any, context?: any, index?: number | null, mode?: Mode): any
  //_addError(path: string, message: string, index?: number | null): void
  describe(): Record<string, any>
}
