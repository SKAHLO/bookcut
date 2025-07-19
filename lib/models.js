export const UserModel = {
  _id: "ObjectId",
  email: "string",
  password: "string", // hashed
  name: "string",
  phone: "string",
  location: {
    address: "string",
    coordinates: [0, 0], // [longitude, latitude]
  },
  userType: "user", // 'user' or 'barber'
  createdAt: "Date",
}

// Barber profile model
export const BarberModel = {
  _id: "ObjectId",
  userId: "ObjectId", // reference to User
  businessName: "string",
  description: "string",
  profileImage: "string",
  portfolioImages: ["string"],
  location: {
    address: "string",
    coordinates: [0, 0],
  },
  contactInfo: {
    phone: "string",
    email: "string",
  },
  services: [
    {
      name: "string",
      price: "number",
      duration: "number", // in minutes
    },
  ],
  workingHours: {
    monday: { start: "string", end: "string", closed: "boolean" },
    tuesday: { start: "string", end: "string", closed: "boolean" },
    wednesday: { start: "string", end: "string", closed: "boolean" },
    thursday: { start: "string", end: "string", closed: "boolean" },
    friday: { start: "string", end: "string", closed: "boolean" },
    saturday: { start: "string", end: "string", closed: "boolean" },
    sunday: { start: "string", end: "string", closed: "boolean" },
  },
  rating: "number",
  reviewCount: "number",
  isProfileComplete: "boolean",
  createdAt: "Date",
}

// Appointment model
export const AppointmentModel = {
  _id: "ObjectId",
  userId: "ObjectId",
  barberId: "ObjectId",
  serviceId: "string",
  appointmentDate: "Date",
  status: "string", // 'pending', 'confirmed', 'completed', 'cancelled'
  notes: "string",
  createdAt: "Date",
}
