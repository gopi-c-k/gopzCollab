const Document = require('../../models/document');

const getRoomDetails = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await Document.findById(documentId)
      .populate('owner', 'name')
      .populate('collaborators', 'name')
      .lean();

    if (!doc) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({
      title: doc.title,
      type: doc.type,
      owner: doc.owner?.name || 'Unknown',
      collaborators: doc.collaborators?.map(u => u.name) || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = getRoomDetails;