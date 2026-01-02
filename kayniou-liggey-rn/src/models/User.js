export class User {
  constructor({
    uid,
    email,
    fullName,
    phoneNumber,
    photoURL = null,
    userType = 'client', // 'client' ou 'worker'
    isActive = true,
    fcmToken = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.uid = uid;
    this.email = email;
    this.fullName = fullName;
    this.phoneNumber = phoneNumber;
    this.photoURL = photoURL;
    this.userType = userType;
    this.isActive = isActive;
    this.fcmToken = fcmToken;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Convertir en objet pour Firestore
  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      fullName: this.fullName,
      phoneNumber: this.phoneNumber,
      photoURL: this.photoURL,
      userType: this.userType,
      isActive: this.isActive,
      fcmToken: this.fcmToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Créer depuis un document Firestore
  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      uid: doc.id,
      email: data.email,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      photoURL: data.photoURL,
      userType: data.userType,
      isActive: data.isActive,
      fcmToken: data.fcmToken,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}

export class ClientProfile {
  constructor({
    userId,
    address = '',
    city = '',
    country = 'Senegal',
    totalRequests = 0,
    completedRequests = 0,
    cancelledRequests = 0,
    averageRating = 0.0,
    totalReviews = 0,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.userId = userId;
    this.address = address;
    this.city = city;
    this.country = country;
    this.totalRequests = totalRequests;
    this.completedRequests = completedRequests;
    this.cancelledRequests = cancelledRequests;
    this.averageRating = averageRating;
    this.totalReviews = totalReviews;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      userId: this.userId,
      address: this.address,
      city: this.city,
      country: this.country,
      totalRequests: this.totalRequests,
      completedRequests: this.completedRequests,
      cancelledRequests: this.cancelledRequests,
      averageRating: this.averageRating,
      totalReviews: this.totalReviews,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ClientProfile({
      userId: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}

export class WorkerProfile {
  constructor({
    userId,
    bio = '',
    categories = [],
    skills = [],
    diplomas = [],
    experiences = [],
    portfolio = [],
    hourlyRate = 0,
    fixedRates = {},
    isAvailable = false,
    location = null,
    serviceRadius = 10, // km
    totalJobs = 0,
    completedJobs = 0,
    cancelledJobs = 0,
    averageRating = 0.0,
    totalReviews = 0,
    averageResponseTime = 0,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.userId = userId;
    this.bio = bio;
    this.categories = categories;
    this.skills = skills;
    this.diplomas = diplomas;
    this.experiences = experiences;
    this.portfolio = portfolio;
    this.hourlyRate = hourlyRate;
    this.fixedRates = fixedRates;
    this.isAvailable = isAvailable;
    this.location = location;
    this.serviceRadius = serviceRadius;
    this.totalJobs = totalJobs;
    this.completedJobs = completedJobs;
    this.cancelledJobs = cancelledJobs;
    this.averageRating = averageRating;
    this.totalReviews = totalReviews;
    this.averageResponseTime = averageResponseTime;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      userId: this.userId,
      bio: this.bio,
      categories: this.categories,
      skills: this.skills,
      diplomas: this.diplomas,
      experiences: this.experiences,
      portfolio: this.portfolio,
      hourlyRate: this.hourlyRate,
      fixedRates: this.fixedRates,
      isAvailable: this.isAvailable,
      location: this.location,
      serviceRadius: this.serviceRadius,
      totalJobs: this.totalJobs,
      completedJobs: this.completedJobs,
      cancelledJobs: this.cancelledJobs,
      averageRating: this.averageRating,
      totalReviews: this.totalReviews,
      averageResponseTime: this.averageResponseTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new WorkerProfile({
      userId: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}
