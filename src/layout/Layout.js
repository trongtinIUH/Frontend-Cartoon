// src/layout/Layout.js
import React, { useCallback, useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatBox from "../components/ChatBox";
import { Outlet, useLocation } from "react-router-dom";
import MovieService from "../services/MovieService";
import ScrollManager from "./ScrollManager.jsx"

const Layout = () => {
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);

  // ✅ Extract movieId from current route for ChatBox context
  const currentMovieId = useMemo(() => {
    const movieDetailMatch = location.pathname.match(/^\/movie\/([^\/]+)/);
    return movieDetailMatch ? movieDetailMatch[1] : null;
  }, [location.pathname]);

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
      <ChatBox currentMovieId={currentMovieId} />
    </>
  );
};

export default Layout;
