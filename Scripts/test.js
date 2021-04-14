const currentDate = new Date(); // current time

const firstOfCurrentMonth = new Date(); // first of current month
firstOfCurrentMonth.setDate(1);

const aYearAgo = new Date(); // exactly a year ago from now
aYearAgo.setYear(aYearAgo.getFullYear() - 1);

const sixMonthsAgo = new Date(); // 6months ago starting at 1st of month
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6, 1);

const currentYearStart = new Date(); // set to jan 1st of current year
currentYearStart.setMonth(0, 1);
// const aMonthsAgo = new Date(); // a month ago starting at 1st of month
// aMonthsAgo.setMonth(aMonthsAgo.getMonth() - 1, 1);

console.log(`Current Date: ${currentDate}`);
console.log(`First of Current month ${firstOfCurrentMonth}`);
console.log(`a Year ago : ${aYearAgo}`);
console.log(`sixMonthsAgo : ${sixMonthsAgo}`);
//console.log(`aMonthsAgo : ${aMonthsAgo}`);
console.log(`Current year start: ${currentYearStart}`);
