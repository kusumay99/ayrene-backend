const { useImperativeHandle } = require("react");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await user.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    role: user.role,        // 🔥 THIS IS REQUIRED
    userId: user._id,
    teamId: user.teamId
  });
};
