const express = require('express');

const Contact = require('../models/Contact');
const { asyncHandler } = require('../utils/asyncHandler');

const ContactsRouter = express.Router();

// Create contact
ContactsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { contactname, phone, email, address } = req.body || {};

    const created = await Contact.create({ contactname, phone, email, address });
    res.status(201).json(created);
  })
);

// Get all contacts
ContactsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  })
);

// Get single contact by id
ContactsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  })
);

// Update contact by id
ContactsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { contactname, phone, email, address } = req.body || {};

    const updated = await Contact.findByIdAndUpdate(
      id,
      { contactname, phone, email, address },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Contact not found' });
    res.json(updated);
  })
);

// Delete contact by id
ContactsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Contact deleted', contact: deleted });
  })
);

module.exports = { ContactsRouter };

