import React from 'react';

const CalendarIcon = ({ width = 24, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M448 64H64C46.3 64 32 78.3 32 96V448C32 465.7 46.3 480 64 480H448C465.7 480 480 465.7 480 448V96C480 78.3 465.7 64 448 64ZM448 448H64V160H448V448ZM128 96C145.7 96 160 110.3 160 128C160 145.7 145.7 160 128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96ZM384 96C401.7 96 416 110.3 416 128C416 145.7 401.7 160 384 160C366.3 160 352 145.7 352 128C352 110.3 366.3 96 384 96Z" fill="black"/>
  </svg>
);

export default CalendarIcon; 