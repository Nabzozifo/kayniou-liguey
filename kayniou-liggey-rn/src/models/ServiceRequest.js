export class ServiceRequest {
  constructor({
    id = null,
    clientId,
    clientName = '',
    title,
    description,
    categories = [],
    mode = 'direct', // 'direct' ou 'auction'
    status = 'pending',
    urgency = 'medium',
    location = null,
    estimatedBudget = null,
    preferredDate = null,
    photos = [],
    viewCount = 0,
    quoteCount = 0,
    assignedWorkerId = null,
    acceptedQuoteId = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.clientId = clientId;
    this.clientName = clientName;
    this.title = title;
    this.description = description;
    this.categories = categories;
    this.mode = mode;
    this.status = status;
    this.urgency = urgency;
    this.location = location;
    this.estimatedBudget = estimatedBudget;
    this.preferredDate = preferredDate;
    this.photos = photos;
    this.viewCount = viewCount;
    this.quoteCount = quoteCount;
    this.assignedWorkerId = assignedWorkerId;
    this.acceptedQuoteId = acceptedQuoteId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      clientId: this.clientId,
      clientName: this.clientName,
      title: this.title,
      description: this.description,
      categories: this.categories,
      mode: this.mode,
      status: this.status,
      urgency: this.urgency,
      location: this.location,
      estimatedBudget: this.estimatedBudget,
      preferredDate: this.preferredDate,
      photos: this.photos,
      viewCount: this.viewCount,
      quoteCount: this.quoteCount,
      assignedWorkerId: this.assignedWorkerId,
      acceptedQuoteId: this.acceptedQuoteId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ServiceRequest({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      preferredDate: data.preferredDate?.toDate(),
    });
  }
}

export class Quote {
  constructor({
    id = null,
    requestId,
    workerId,
    workerName = '',
    workerPhoto = null,
    workerRating = 0,
    price,
    estimatedDuration,
    description,
    servicesIncluded = [],
    availableDate = null,
    additionalNotes = '',
    status = 'pending',
    score = 0,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.requestId = requestId;
    this.workerId = workerId;
    this.workerName = workerName;
    this.workerPhoto = workerPhoto;
    this.workerRating = workerRating;
    this.price = price;
    this.estimatedDuration = estimatedDuration;
    this.description = description;
    this.servicesIncluded = servicesIncluded;
    this.availableDate = availableDate;
    this.additionalNotes = additionalNotes;
    this.status = status;
    this.score = score;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      requestId: this.requestId,
      workerId: this.workerId,
      workerName: this.workerName,
      workerPhoto: this.workerPhoto,
      workerRating: this.workerRating,
      price: this.price,
      estimatedDuration: this.estimatedDuration,
      description: this.description,
      servicesIncluded: this.servicesIncluded,
      availableDate: this.availableDate,
      additionalNotes: this.additionalNotes,
      status: this.status,
      score: this.score,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Quote({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      availableDate: data.availableDate?.toDate(),
    });
  }
}
