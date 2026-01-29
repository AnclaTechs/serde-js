const {
  Serializer,
  CharField,
  IntegerField,
  ObjectField,
  ArrayField,
} = require("@anclatechs/serde-js");

const AddressSerializer = new Serializer({
  stret: new CharField(),
  city: new CharField(),
});

const UserSerializer = new Serializer({
  name: new CharField(),
  age: new IntegerField().optional(),
  address: new ObjectField(AddressSerializer),
  tags: new ArrayField(new CharField()),
});

const { data, errors } = UserSerializer.serialize(
  {
    name: "Ada",
    address: { street: "42 Loop", city: "Lagos" },
    tags: ["0"],
  },
  {},
);

console.log({ data, errors });
