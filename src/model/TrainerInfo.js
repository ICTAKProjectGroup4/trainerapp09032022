const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority');
//schema definition
const Schema2 = mongoose.Schema;
//creating a model ith the collection
var trainerinfoSchema = new Schema2({
       
    name: String, 
    address: String,
     approved: Boolean, 
     company: String, 
     courses: String, 
     designation: String, 
     email: String ,
     id:Number,
     phone:Number,
     qualification:String, 
     skill:String,
     type:String,
     photo: String
});
var TrainerInfo = mongoose.model('users', trainerinfoSchema);

module.exports= TrainerInfo;
