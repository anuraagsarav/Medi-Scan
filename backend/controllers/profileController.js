const User = require("../models/userModel");

exports.updateFullProfile = async (req, res) => {
  const { emergencyContacts, vitals, ...profileData } = req.body;

  try {
    const user = await User.findById(req.user.id);

    Object.assign(user, profileData);

    if (emergencyContacts) user.emergencyContacts = emergencyContacts;
    if (vitals) user.vitals.push(...vitals);

    await user.save();

    res.json({ msg: "Profile, contacts, and vitals updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to update full profile" });
  }
};
