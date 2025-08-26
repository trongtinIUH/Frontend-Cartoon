// src/layout/Layout.js
import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatBox from "../components/ChatBox";
import { Outlet } from "react-router-dom";
import MovieService from "../services/MovieService";
import ScrollManager from "./ScrollManager.jsx"

const Layout = () => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);

  const fetchMovies = useCallback(async () => {
    try {
      const data = await MovieService.getAllMovies();
      setMovies(data || []);
      setFilteredMovies(data || []);
    } catch {
      setMovies([]);
      setFilteredMovies([]);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return (
    <>
      <Header fetchMovies={fetchMovies} setFilteredMovies={setFilteredMovies} />
      <ScrollManager /> 
      <Outlet context={{ movies, setMovies }} />
      <Footer />
      <ChatBox />
    </>
  );
};

export default Layout;
