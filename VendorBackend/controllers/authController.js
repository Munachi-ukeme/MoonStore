const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//helper function - convert business name to slug
// "Chinwe Fashion" -> "chinwe-fashion"
const generateSlug = (businessName) =>{
    return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "") // remove special characters
    .replace(/\s+/g, "-") //replace with hyphens
}

// REGISTER SELLER
// POST /api/auth/register

const registerSeller = async(req, res) =>{
    try{
        const {businessName, email, password, whatsappNumber } = req.body

        //1. Check if email already exists
        const existingSeller = await Seller.findOne({email})
        if (existingSeller) {
            return res.status(400).json({message: "Email already registered"})
        }

        //2. generate slug from business name
        let slug = generateSlug(businessName)

        //3. check if slug already exists - add number if it does. e.g if chinwe-fashion already exists create chinwe-fashion-1

        const existingSlug = await Seller.findOne({ slug })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    //4. Hash the password before saving
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)


    // 5. Create new seller
    const seller = await Seller.create({
      businessName,
      email,
      password: hashedPassword,
      whatsappNumber,
      slug,
    })

    // 6. Generate JWT token
    const token = jwt.sign(
      { id: seller._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // token expires in 30 days
    )

     // 7. Return seller data and token
    res.status(201).json({
      message: "Seller registered successfully",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        plan: seller.plan,
      },
    })

    } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


// LOGIN SELLER
// POST /api/auth/login
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Check if seller exists
    const seller = await Seller.findOne({ email })
    if (!seller) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // 2. Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, seller.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: seller._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    )

    // 4. Return seller data and token
    res.json({
      message: "Login successful",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        plan: seller.plan,
      },
    })

} catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { registerSeller, loginSeller }