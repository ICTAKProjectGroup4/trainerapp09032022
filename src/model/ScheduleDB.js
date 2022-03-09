const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority')
const Schema = mongoose.Schema;

var scheduleSchema = new Schema({
    id: Number,
    startDate: Date,
    endDate: Date,
    course: String,
    batch: String,
    link: String,
    name: String,
    meeting: String,
    startTime: String,
    endTime: String,
  });

var ScheduleInfo = mongoose.model('schedules', scheduleSchema);

module.exports = ScheduleInfo;