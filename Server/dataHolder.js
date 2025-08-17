/**
 * Data Holder Class for Firestore Document/Collection Operations
 *
 * This class provides a generic structure for storing Firestore documents or collections
 * along with their sub-documents and sub-collections in a tree-like structure.
 *
 * @author Raedam Team
 * @version 2.0.0
 * @since 2020
 */

/**
 * DataHolder class for storing Firestore document/collection data
 */
class DataHolder {
  /**
   * Create a new DataHolder instance
   * @param {string} id - Unique identifier for the document/collection
   * @param {Object} data - Document data or collection metadata
   */
  constructor(id, data) {
    if (!id || typeof id !== 'string') {
      throw new Error('DataHolder requires a valid string ID');
    }

    this.id = id;
    this.data = data || {};
    this.subDoc = [];
    this.createdAt = new Date();
    this.lastModified = new Date();
  }

  /**
   * Add a sub-document or sub-collection to this DataHolder
   * @param {DataHolder} subDocument - Sub-document to add
   * @return {number} New length of subDoc array
   */
  addSubDocument(subDocument) {
    if (!(subDocument instanceof DataHolder)) {
      throw new Error('Sub-document must be an instance of DataHolder');
    }

    this.subDoc.push(subDocument);
    this.lastModified = new Date();
    return this.subDoc.length;
  }

  /**
   * Remove a sub-document by ID
   * @param {string} subDocId - ID of sub-document to remove
   * @return {boolean} True if sub-document was removed
   */
  removeSubDocument(subDocId) {
    const initialLength = this.subDoc.length;
    this.subDoc = this.subDoc.filter((doc) => doc.id !== subDocId);

    if (this.subDoc.length !== initialLength) {
      this.lastModified = new Date();
      return true;
    }

    return false;
  }

  /**
   * Find a sub-document by ID
   * @param {string} subDocId - ID of sub-document to find
   * @return {DataHolder|null} Found sub-document or null
   */
  findSubDocument(subDocId) {
    return this.subDoc.find((doc) => doc.id === subDocId) || null;
  }

  /**
   * Get all sub-documents as an array
   * @return {DataHolder[]} Array of sub-documents
   */
  getSubDocuments() {
    return [...this.subDoc];
  }

  /**
   * Get the total count of sub-documents (recursive)
   * @return {number} Total count of all sub-documents
   */
  getTotalSubDocumentCount() {
    let count = this.subDoc.length;

    for (const subDoc of this.subDoc) {
      count += subDoc.getTotalSubDocumentCount();
    }

    return count;
  }

  /**
   * Check if this DataHolder has any sub-documents
   * @return {boolean} True if has sub-documents
   */
  hasSubDocuments() {
    return this.subDoc.length > 0;
  }

  /**
   * Get the depth of this DataHolder in the tree
   * @return {number} Depth level (0 for root)
   */
  getDepth() {
    if (this.subDoc.length === 0) {
      return 0;
    }

    const maxDepth = Math.max(...this.subDoc.map((doc) => doc.getDepth()));
    return maxDepth + 1;
  }

  /**
   * Convert DataHolder to plain object (for serialization)
   * @return {Object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      data: this.data,
      subDoc: this.subDoc.map((doc) => doc.toObject()),
      createdAt: this.createdAt,
      lastModified: this.lastModified,
    };
  }

  /**
   * Create DataHolder from plain object
   * @param {Object} obj - Plain object to convert
   * @return {DataHolder} New DataHolder instance
   */
  static fromObject(obj) {
    const dataHolder = new DataHolder(obj.id, obj.data);
    dataHolder.createdAt = new Date(obj.createdAt);
    dataHolder.lastModified = new Date(obj.lastModified);

    if (obj.subDoc && Array.isArray(obj.subDoc)) {
      dataHolder.subDoc = obj.subDoc.map((doc) => DataHolder.fromObject(doc));
    }

    return dataHolder;
  }

  /**
   * Validate DataHolder structure
   * @return {boolean} True if valid
   */
  validate() {
    if (!this.id || typeof this.id !== 'string') {
      return false;
    }

    if (!Array.isArray(this.subDoc)) {
      return false;
    }

    for (const subDoc of this.subDoc) {
      if (!(subDoc instanceof DataHolder) || !subDoc.validate()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get summary information about this DataHolder
   * @return {Object} Summary object
   */
  getSummary() {
    return {
      id: this.id,
      dataKeys: Object.keys(this.data || {}),
      subDocumentCount: this.subDoc.length,
      totalSubDocumentCount: this.getTotalSubDocumentCount(),
      depth: this.getDepth(),
      createdAt: this.createdAt,
      lastModified: this.lastModified,
    };
  }
}

module.exports = DataHolder;
