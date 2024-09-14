const axios = require('axios')
const { z } = require("zod")
const { DynamicStructuredTool } = require("@langchain/core/tools")
const { DynamicTool } = require("@langchain/core/tools");

const toolGetToday = new DynamicTool({
  name: "get_today",
  description: "Gunakan tool ini untuk mendapatkan tanggal hari ini.",
  func: async () => {
    return 'Tanggal hari ini adalah ' + new Date().toISOString().slice(0, 10);
  },
});

const toolGetThisMonth = new DynamicTool({
  name: "get_this_month",
  description: "Gunakan tool ini untuk mendapatkan bulan ini.",
  func: async () => {
    const date = new Date();
    return 'Bulan ini adalah ' + (date.getMonth() + 1) + '-' + date.getFullYear();
  },
});

const toolGetThisWeek = new DynamicTool({
  name: "get_this_week",
  description: "Gunakan tool ini untuk mendapatkan minggu ini.",
  func: async () => {
    const date = new Date();
    const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
    const endOfWeek = new Date(date.setDate(date.getDate() - date.getDay() + 6));
    return 'Minggu ini adalah dari ' + startOfWeek.toISOString().slice(0, 10) + ' sampai ' + endOfWeek.toISOString().slice(0, 10);
  },
});

const toolGetYesterday = new DynamicTool({
  name: "get_yesterday",
  description: "Gunakan tool ini untuk mendapatkan tanggal kemarin.",
  func: async () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return 'Tanggal kemarin adalah ' + date.toISOString().slice(0, 10);
  },
});

const toolGetThisYear = new DynamicTool({
  name: "get_this_year",
  description: "Gunakan tool ini untuk mendapatkan tahun ini.",
  func: async () => {
    const date = new Date();
    return 'Tahun ini adalah ' + date.getFullYear();
  },
});

const toolGetLastYear = new DynamicTool({
  name: "get_last_year",
  description: "Gunakan tool ini untuk mendapatkan tahun kemarin.",
  func: async () => {
    const date = new Date();
    return 'Tahun kemarin adalah ' + (date.getFullYear() - 1);
  },
});

const toolGetLastWeek = new DynamicTool({
  name: "get_last_week",
  description: "Gunakan tool ini untuk mendapatkan minggu kemarin.",
  func: async () => {
    const date = new Date();
    const startOfLastWeek = new Date(date.setDate(date.getDate() - date.getDay() - 7));
    const endOfLastWeek = new Date(date.setDate(date.getDate() - date.getDay() - 1));
    return 'Minggu kemarin adalah dari ' + startOfLastWeek.toISOString().slice(0, 10) + ' sampai ' + endOfLastWeek.toISOString().slice(0, 10);
  },
});

function getDateInfo() {
  const date = new Date();
  
  const listDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const listMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = 'Today is: ' + listDay[date.getDay()] + ', month: ' + listMonth[date.getMonth()] + ", year: " + date.getFullYear();
  const today = 'Today\'s date is ' + date.toISOString().slice(0, 10);
  const thisMonth = 'This month is ' + (date.getMonth() + 1) + '-' + date.getFullYear();
  const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
  const endOfWeek = new Date(date.setDate(date.getDate() - date.getDay() + 6));
  const thisWeek = 'This week is from ' + startOfWeek.toISOString().slice(0, 10) + ' to ' + endOfWeek.toISOString().slice(0, 10);
  date.setDate(date.getDate() - 1);
  const yesterday = 'Yesterday\'s date was ' + date.toISOString().slice(0, 10);
  const thisYear = 'This year is ' + date.getFullYear();
  const lastYear = 'Last year was ' + (date.getFullYear() - 1);
  const startOfLastWeek = new Date(date.setDate(date.getDate() - date.getDay() - 7));
  const endOfLastWeek = new Date(date.setDate(date.getDate() - date.getDay() - 1));
  const lastWeek = 'Last week was from ' + startOfLastWeek.toISOString().slice(0, 10) + ' to ' + endOfLastWeek.toISOString().slice(0, 10);
  const lastMonth = 'Last month was ' + (date.getMonth() === 0 ? 12 : date.getMonth()) + '-' + (date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear());
  return `${day}, ${today}, ${thisWeek}, ${thisMonth}, ${thisYear}, ${yesterday}, ${lastYear}, ${lastWeek}, ${lastMonth}`;
}

function getStringDateInfo() {
  const date = new Date();
  const listDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const listMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = `Hari ini adalah Hari ${listDay[date.getDay()]}, bulan ${listMonth[date.getMonth()]}, tahun: ${date.getFullYear()}`;
  const dateNow = date.toISOString().slice(0, 10);
  const thisMonth = 'This month is ' + (date.getMonth() + 1) + '-' + date.getFullYear();
  const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
  const endOfWeek = new Date(date.setDate(date.getDate() - date.getDay() + 6));
  const thisWeek = 'This week is from ' + startOfWeek.toISOString().slice(0, 10) + ' to ' + endOfWeek.toISOString().slice(0, 10);
  date.setDate(date.getDate() - 1);
  const yesterday = 'Yesterday\'s date was ' + date.toISOString().slice(0, 10);
  const thisYear = 'This year is ' + date.getFullYear();
  const lastYear = 'Last year was ' + (date.getFullYear() - 1);
  const startOfLastWeek = new Date(date.setDate(date.getDate() - date.getDay() - 7));
  const endOfLastWeek = new Date(date.setDate(date.getDate() - date.getDay() - 1));
  const lastWeek = 'Last week was from ' + startOfLastWeek.toISOString().slice(0, 10) + ' to ' + endOfLastWeek.toISOString().slice(0, 10);
  const lastMonth = 'Last month was ' + (date.getMonth() === 0 ? 12 : date.getMonth()) + '-' + (date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear());
  return {
      day: day,
      dateNow: dateNow,
      thisWeek: thisWeek,
      thisMonth: thisMonth,
      thisYear: thisYear,
      yesterday: yesterday,
      lastYear: lastYear,
      lastWeek: lastWeek,
      lastMonth: lastMonth
  };
}


module.exports = {
    toolGetToday,
    toolGetThisWeek,
    toolGetYesterday,
    toolGetThisYear,
    toolGetLastYear,
    toolGetLastWeek,
    toolGetThisMonth,
    getDateInfo,
    getStringDateInfo
}
