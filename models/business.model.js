const mongoose = require("mongoose");

var BusinessSchema = mongoose.Schema({
    loc: { type: {type:String}, coordinates: [Number]},
    pin_icon_type: String, //restorant or shop
    restro_icon: String,
    name: String,
    address: String,
    description:String,      
    createdAt:{type: Date, default: Date.now }
}, {
    timestamps: true
});

//create the model for users and expose it to our app
module.exports = mongoose.model('business', BusinessSchema);