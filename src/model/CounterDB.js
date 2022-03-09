const mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost:27017/Library');
//mongose and backend connection establishment
//mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority');

mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority');
//schema definition
const Schema2 = mongoose.Schema;
//creating a model ith the collection
var counterinfoSchema = new Schema2({
    type: String,
    seq: Number
});
var CounterInfo = mongoose.model('counters', counterinfoSchema);
module.exports= CounterInfo;