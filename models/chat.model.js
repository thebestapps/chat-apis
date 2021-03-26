const mongoose = require("mongoose");

var chatSchema = mongoose.Schema({
    userOne: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    userTwo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    chat: [{
        user_id: String,
        username: String,
        text: String,
        time: String,
        date: String,
        pin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'map_lat_long'
        },
        createdAt: String
    }]
}, {
    timestamps: true
});

//create the model for users and expose it to our app
module.exports = mongoose.model('chat', chatSchema);