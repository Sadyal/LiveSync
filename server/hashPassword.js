import bcrypt from 'bcryptjs';

const password = "Admin_S@dy@l@coll@b#mongo";

const hashPassword = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  console.log("Hashed password:", hashed);
};

hashPassword();
