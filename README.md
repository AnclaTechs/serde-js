## @anclatechs/serde-js

A **context-aware, declarative serialization and validation framework** for JavaScript.

`serde-js` lets you define **one schema** that can:

- validate user input (writes)
- safely serialize output (reads)
- enforce conditional logic via context
- support nested objects and arrays
- aggregate errors with precise paths

Inspired by Django REST Framework, Zod, and Joi — but designed to stay **lightweight, explicit, and extensible**.

---

## Table of Contents

- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Quick Start](#quick-start)
- [Fields](#fields)
- [Serializer](#serializer)
- [Read vs Write Modes](#read-vs-write-modes)
- [Context-Aware Rules](#context-aware-rules)
- [Validation](#validation)
- [Nested Serializers](#nested-serializers)
- [ArrayField](#arrayfield)
- [Error Handling](#error-handling)
- [Schema Introspection](#schema-introspection)
- [Advanced Patterns](#advanced-patterns)
- [Design Philosophy](#design-philosophy)

---

## Installation

```bash
npm install @anclatechs/serde-js
```

```js
const {
  Serializer,
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
} = require("@anclatechs/serde-js");
```

---

## Core Concepts

### 1. One schema — many use cases

A single `Serializer` definition can:

- validate **input** (e.g. signup, update)
- serialize **output** (API responses)
- behave differently based on **context**

No duplicate schemas. No conditionals scattered across controllers.

---

### 2. Fields are intelligent

Each field:

- knows whether it is required
- can be optional or have defaults
- supports custom validators
- can be read-only or write-only
- can be conditionally included

---

### 3. Context drives behavior

Context is an arbitrary object you pass at runtime. Example:

```js
{
  mode: "input" | "output",
  isSignup: true,
  userRole: "admin"
}
```

Fields and validators can react to it.

---

## Quick Start

```js
const UserSerializer = new Serializer({
  name: new CharField(),
  age: new IntegerField().optional(),
  email: new EmailField(),
});

const result = UserSerializer.serialize({
  name: "Ada",
  age: 30,
  email: "ada@example.com",
});

console.log(result.data);
```

---

## Fields

### Base `Field`

All fields inherit from `Field`.

Supported features:

```js
new Field()
  .optional()
  .default(value)
  .validate(fn)
  .onlyIf((ctx) => boolean)
  .readOnly()
  .writeOnly();
```

`CharField`, in addition to the validate function, also provide helper methods:

```js
.enumOptions([])
.minLength(num)
.maxLength(num)
```

`NumberField` and `IntegerField` also both support the `.min()` and `.max()` helper methods.

---

### Available Field Types

| Field           | Description    |
| --------------- | -------------- |
| `CharField`     | String values  |
| `NumberField`   | Any number     |
| `IntegerField`  | Integer-only   |
| `BooleanField`  | Boolean        |
| `DateTimeField` | JS Date (ISO)  |
| `DateField`     | Date-only      |
| `EmailField`    | Email string   |
| `UrlField`      | URL string     |
| `ArrayField`    | Arrays         |
| `ObjectField`   | Nested objects |

---

## Serializer

### Creating a Serializer

```js
const UserSerializer = new Serializer(schema, options);
```

### Options

```js
{
  many?: boolean // expect an array of objects
}
```

---

## Read vs Write Modes

### Why this matters

Often:

- some fields should only be **accepted** (password)
- some should only be **returned** (id, timestamps)

### Example

```js
const UserSerializer = new Serializer({
  id: new IntegerField().readOnly(),
  email: new EmailField(),
  password: new CharField().writeOnly(),
});
```

#### Input (write)

```js
UserSerializer.serialize(req.body, { mode: "input" });
```

#### Output (read)

```js
UserSerializer.serialize(user, { mode: "output" });
```

---

## Context-Aware Rules

### `onlyIf(fn)`

Conditionally include a field.

```js
role: new CharField().onlyIf((ctx) => ctx.userRole === "admin");
```

### Signup-only fields

```js
password: new CharField().onlyIf((ctx) => ctx.isSignup);
```

If the condition fails, the field is:

- not required
- not validated
- not serialized

---

## Validation

### Custom Validators

```js
age: new IntegerField().validate((v) => v >= 18 || "Must be 18+");
```

Validators return:

- `true` → pass
- `false` or `string` → fail

---

### Reusable Validator Helpers

```js
const min = (n) => (v) => v >= n || `Must be ≥ ${n}`;
const minLength = (n) => (v) => v.length >= n || `Min length ${n}`;
```

```js
password: new CharField().validate(minLength(8));
```

---

## Nested Serializers

### `ObjectField`

```js
const AddressSerializer = new Serializer({
  street: new CharField(),
  city: new CharField(),
});

const UserSerializer = new Serializer({
  name: new CharField(),
  address: new ObjectField(AddressSerializer),
});
```

Nested errors are merged automatically:

```
address.city: Field is required
```

---

## ArrayField

### Array of scalars

```js
tags: new ArrayField(new CharField());
```

### Array of objects

```js
posts: new ArrayField(PostSerializer);
```

Each item is validated independently with full error paths:

```
posts[2].title: Field is required
```

---

## Error Handling

Errors are aggregated on the serializer:

```js
serializer.errors;
```

Example:

```js
{
  "email": "Invalid EmailField",
  "address.city": "Field is required",
  "tags[1]": "Invalid CharField"
}
```

No exceptions. Full visibility.

---

## Schema Introspection

### `describe()`

```js
UserSerializer.describe();
```

Returns:

```js
{
  email: {
    type: "EmailField",
    required: true
  },
  tags: {
    type: "ArrayField",
    child: "CharField"
  }
}
```

Useful for:

- documentation
- form generation
- schema inspection

---

## Advanced Patterns

### Cross-field validation

```js
password: new CharField(),
confirmPassword: new CharField().validate((v, ctx) =>
  v === ctx.password || "Passwords do not match"
)
```

### Role-based schemas

```js
salary: new NumberField().onlyIf((ctx) => ctx.userRole === "admin");
```

### Partial updates

```js
new CharField().optional().onlyIf((ctx) => ctx.isUpdate);
```

---

## Design Philosophy

- Explicit over magical
- One schema, many flows
- Context drives behavior
- Errors should be precise
- Composition over inheritance

`serde-js` is intentionally unopinionated about:

- HTTP frameworks
- Databases
- ORMs

It fits cleanly into Express, Fastify, NestJS, or serverless setups.

---

## Final Note

This library is intentionally **small but powerful**; supporting optional fields, default values, custom validators, aggregated error reporting, and context-aware serialization. Fields are required by default, your may define defaults or validation rules, and can dynamically include or validate data based on your preferred runtime context. Validation errors are collected and returned in a structured, predictable format suitable for APIs and batch processing.

If you understand how context flows, you can model:

- signup
- updates
- admin overrides
- read/write separation

…without ever duplicating schemas.

<br/>

📜 License

[MIT](./LICENSE) — use it, hack it, ship it.

Happy building 🚀
