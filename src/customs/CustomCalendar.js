import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CustomeCalendar = ({ date, setDate }) => {
  return (
    <DatePicker
      selected={date}
      onChange={(date) => setDate(date)}
      dateFormat="MMMM d, yyyy"
      minDate={new Date()}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      placeholderText="Select a date"
      className="custom-datepicker"
    />
  );
};

export default CustomeCalendar;
