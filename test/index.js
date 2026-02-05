const {
  Serializer,
  CharField,
  IntegerField,
  NumberField,
  ObjectField,
  ArrayField,
  JsonField,
} = require("@anclatechs/serde-js");

const AddressSerializer = new Serializer({
  street: new CharField(),
  city: new CharField(),
});

const UserSerializer = new Serializer({
  name: new CharField(),
  age: new IntegerField().min(18),
  ageInTwoYears: new IntegerField()
    .default((_, root) => root.age * 2)
    .readOnly(),
  address: new ObjectField(AddressSerializer),
  tags: new ArrayField(new CharField()),
  metadata: new JsonField().default({ createdBy: "system" }),
});

const { data, errors, isValid, verboseErrorList } = UserSerializer.serialize(
  {
    name: "",
    age: 18,
    address: { street: "42 Loop", city: "Lagos" },
    tags: ["0", "AB"],
    metadata: { done: "true", a: { b: false } },
  },
  { mode: "output", context: { isAdmin: true } },
);

console.log({ data, errors, valid: isValid(), errorList: verboseErrorList() });
