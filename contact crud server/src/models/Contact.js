const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    contactname: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true }
  },
  {
    timestamps: true
  }
);

// Basic helpful indexes/constraints
ContactSchema.index({ email: 1 });
ContactSchema.index({ phone: 1 });

module.exports = mongoose.model('Contact', ContactSchema);

