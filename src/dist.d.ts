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

export declare class Field {
  required: boolean
  defaultValue?: any
  validators: ValidatorFn[]
  contextRule?: ContextRuleFn
  writeOnly?: boolean
  readOnly?: boolean

  optional(): this
  default(value: any): this
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

export interface SerializerOptions {
  many?: boolean
}

export declare class Serializer {
  schema: Record<string, Field>
  many: boolean
  errors: Record<string, string>

  constructor(schema: Record<string, Field>, options?: SerializerOptions)

  serialize(input: any, context?: any, mode?: Mode): this
  //_serializeItem(item: any, context?: any, index?: number | null, mode?: Mode): any
  //_addError(path: string, message: string, index?: number | null): void
  describe(): Record<string, any>
}
