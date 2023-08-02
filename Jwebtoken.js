const {sign , verify} = require('jsonwebtoken');

const createToken = (User) => {
    const accessToken = sign(
     {username: User.username, id: User.id}, "SECRET", {
     expiresIn: 60 * 60 * 24,
     }
    )

    return accessToken;
};

const validateToken = (req, res, next) => {
    const accessToken = req.cookies["access-token"];
  
    if (!accessToken)
      return res.status(400).json({ error: "User not Authenticated!" });
  
    try {
      const validToken = verify(accessToken, "SECRET");
      if (validToken) {
        req.authenticated = true;
        return next();
      }
    } catch (err) {
      return res.status(400).json({ error: err });
    }
  };


module.exports = { createToken, validateToken }



