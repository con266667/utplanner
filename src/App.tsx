import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './Home';
import CourseConf from './CourseConf';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='courses/*' element={<CourseConf />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
