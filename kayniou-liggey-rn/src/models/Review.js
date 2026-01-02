export class Review {
  constructor({
    id = null,
    requestId,
    clientId,
    clientName = '',
    workerId,
    overallRating,
    comment,
    photos = [],
    qualityRating = null,
    punctualityRating = null,
    communicationRating = null,
    professionalismRating = null,
    wouldRecommend = true,
    workerResponse = null,
    workerRespondedAt = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.requestId = requestId;
    this.clientId = clientId;
    this.clientName = clientName;
    this.workerId = workerId;
    this.overallRating = overallRating;
    this.comment = comment;
    this.photos = photos;
    this.qualityRating = qualityRating;
    this.punctualityRating = punctualityRating;
    this.communicationRating = communicationRating;
    this.professionalismRating = professionalismRating;
    this.wouldRecommend = wouldRecommend;
    this.workerResponse = workerResponse;
    this.workerRespondedAt = workerRespondedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      requestId: this.requestId,
      clientId: this.clientId,
      clientName: this.clientName,
      workerId: this.workerId,
      overallRating: this.overallRating,
      comment: this.comment,
      photos: this.photos,
      qualityRating: this.qualityRating,
      punctualityRating: this.punctualityRating,
      communicationRating: this.communicationRating,
      professionalismRating: this.professionalismRating,
      wouldRecommend: this.wouldRecommend,
      workerResponse: this.workerResponse,
      workerRespondedAt: this.workerRespondedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Review({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      workerRespondedAt: data.workerRespondedAt?.toDate(),
    });
  }
}
