const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/mongodb");

const addHotel = async ({ username, password, hotelcode, directory }) => {
  const db = await connectDB();
  const hash = await bcrypt.hash(password, 10);
  await db.collection("hotels").insertOne({
    username,
    password, // PLAIN TEXT
    // password: hash,
    hotelcode,
    directory,
    active: true,
    createdAt: new Date(),
  });
};

const editHotel = async (hotelcode, updateData) => {
  const db = await connectDB();
  const updateFields = { ...updateData };
  // if (updateFields.password) {
  //   updateFields.password = await bcrypt.hash(updateFields.password, 10);
  // }
  updateFields.updatedAt = new Date();

  const result = await db
    .collection("hotels")
    .findOneAndUpdate(
      { hotelcode: hotelcode },
      { $set: updateFields },
      { returnDocument: "after" },
    );

  // console.log(result.value);
  return result.value;
};

const deleteHotel = async (hotelcode) => {
  const db = await connectDB();
  return db.collection("hotels").deleteOne({
    hotelcode: hotelcode,
  });
};

const getAllHotels = async () => {
  const db = await connectDB();
  return (
    db
      .collection("hotels")
      // .find({}, { projection: { password: 0 } })
      .find({})
      .toArray()
  );
};

const getHotelByHotelcode = async (hotelcode) => {
  const db = await connectDB();
  return db.collection("hotels").findOne({
    hotelcode,
  });
};

const getHotelByUserPass = async (username, password) => {
  username = username.toString();
  password = password.toString();
  const db = await connectDB();
  const hotel = await db.collection("hotels").findOne({
    username: username,
    password: password,
  });
  // console.log(hotel);
  // if (!hotel) return null;
  // const passwordMatch = await bcrypt.compare(password, hotel.password);
  // if (!passwordMatch) return null;
  return hotel || null;
};

const verifyHotel = async (username, password, hotelcode) => {
  // const hotel = await getHotelByHotelcode(hotelcode);
  // if (!hotel) return null;
  // const ok = await bcrypt.compare(password, hotel.password);
  // return ok ? hotel : null;
  const db = await connectDB();
  const hotel = await db.collection("hotels").findOne({
    hotelcode: hotelcode,
    password: password,
  });
  return hotel || null;
};

module.exports = {
  addHotel,
  editHotel,
  deleteHotel,
  getAllHotels,
  getHotelByHotelcode,
  getHotelByUserPass,
  verifyHotel,
};
