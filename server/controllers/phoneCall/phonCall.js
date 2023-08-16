const PhoneCall = require('../../model/schema/phoneCall');
const User = require('../../model/schema/user');
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const result = new PhoneCall(req.body);
        const user = await User.findById({ _id: result.sender });
        user.outboundcall = user.outboundcall + 1;

        await user.save();
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to create :', err);
        res.status(400).json({ err, error: 'Failed to create' });
    }
}

const index = async (req, res) => {
    try {
  

        const query = req.query
        if (query.sender) {
            query.sender = new mongoose.Types.ObjectId(query.sender);
        }
        let result = await PhoneCall.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: '$contact' },
            { $match: { 'contact.deleted': false } },
            {
                $addFields: {
                    senderName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    deleted: '$contact.deleted',
                    createByName: { $concat: ['$contact.title', ' ', '$contact.firstName', ' ', '$contact.lastName'] },
                }
            },
            { $project: { contact: 0, users: 0 } },

        ])

        res.status(200).json(result);
    } catch (err) {
        console.error('Failed :', err);
        res.status(400).json({ err, error: 'Failed ' });
    }
}

const view = async (req, res) => {
    try {
        let result = await PhoneCall.findOne({ _id: req.params.id })

        if (!result) return res.status(404).json({ message: "no Data Found." })

        let response = await PhoneCall.aggregate([
            { $match: { _id: result._id } },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: '$contact' },
            { $match: { 'contact.deleted': false } },
            {
                $addFields: {
                    senderName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                    deleted: '$contact.deleted',
                    createByName: { $concat: ['$contact.title', ' ', '$contact.firstName', ' ', '$contact.lastName'] },
                }
            },
            { $project: { contact: 0, users: 0 } }
        ])

        res.status(200).json(response[0])
    } catch (err) {
        console.error('Failed :', err);
        res.status(400).json({ err, error: 'Failed ' });
    }
}

module.exports = { add, index, view }