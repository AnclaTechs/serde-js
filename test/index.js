const {
  Serializer,
  CharField,
  IntegerField,
  NumberField,
  ObjectField,
  ArrayField,
} = require("@anclatechs/serde-js");

const AddressSerializer = new Serializer({
  stret: new CharField().enumOptions(),
  city: new CharField(),
});

const UserSerializer = new Serializer({
  name: new CharField(),
  age: new IntegerField().min(20).max(50).optional(),
  address: new ObjectField(AddressSerializer),
  tags: new ArrayField(new CharField()),
});

const { data, errors } = UserSerializer.serialize(
  {
    name: "Ada",
    age: 51,
    address: { street: "42 Loop", city: "Lagos" },
    tags: ["0"],
  },
  {},
);

console.log({ data, errors });
