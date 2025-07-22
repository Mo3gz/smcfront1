import React, { useState } from 'react';

const programData = [
  {
    day: 'Day 1',
    schedule: [
      '7:30--9:30\tالقداس',
      '9:30--10:00\tفطار',
      '10:00--11:30\tتحرك--وصول',
      '11:30--12:00\tتغيير هدوم',
      '12:00--1:00\tنصب الخيم',
      '1:00--1:30\tمقدمه المعسكر',
      '1:30--3:00\tتحضير تفتيش',
      '3:00--4:30\tبسين(بنات)----راحه(ولاد)',
      '4:30--6:00\tبسين(ولاد)----راحه(بنات)',
      '6:00--6:30\tغذاء',
      '6:30--6:45\tلبس',
      '6:45--7:30\tتفتيش+صلاه',
      '7:30--8:30\tمحاضره',
      '8:30--10:00\tالعاب',
      '10:00--11:00\tتحضير السمر',
      '11:00--12:00\tالسمر+عشاء+صلاه',
    ],
  },
  {
    day: 'Day 2',
    schedule: [
      '7:15--8:00\tصحيان وتغيير هدوم',
      '8:00--8:20\tصلاة',
      '8:20--8:45\tطابور رياضي',
      '8:45--9:30\tفطار',
      '9:30--11:30\tتحضير تفتيش',
      '11:30--12:30\tمحاضرة',
      '12:30--2:00\tكنز',
      '2:00--3:00\tغذاء',
      '3:00--4:30\tبسين(بنات)--راحه(ولاد)',
      '4:30--6:00\tبسين(ولاد)--راحه(بنات)',
      '6:00--6:45\tاستحمام ولبس',
      '6:45--8:00\tتفتيش+صلاه غروب',
      '8:00--8:45\tكلمه كابتن بونو',
      '8:45--9:45\tتحضير السمر',
      '9:45--10:45\tالسمر+فيديوهات+صلاه+عشاء',
      '10:45\tفقره حره',
    ],
  },
  {
    day: 'Day 3',
    schedule: [
      '8:15--9:00\tصحيان+تغيير هدوم',
      '9:00--9:15\tصلاه باكر',
      '9:15--10:00\tلم الخيم والنماذج',
      '10:00--11:00\tconclusion - خيمه مثاليه',
      '11:30\tتحرك',
    ],
  },
];

const ProgramOfTheDay = () => {
  const [openDay, setOpenDay] = useState(null);

  const toggleDay = (idx) => {
    setOpenDay(openDay === idx ? null : idx);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Program of the Day</h2>
      {programData.map((day, idx) => (
        <div key={day.day} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => toggleDay(idx)}
            style={{
              width: '100%',
              background: '#667eea',
              color: 'white',
              padding: '12px 16px',
              fontSize: 18,
              fontWeight: 'bold',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {day.day} {openDay === idx ? '▲' : '▼'}
          </button>
          {openDay === idx && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 16, background: '#f9f9f9', direction: 'rtl' }}>
              {day.schedule.map((item, i) => (
                <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee', fontSize: 16 }}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgramOfTheDay; 