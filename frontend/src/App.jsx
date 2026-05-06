import { Routes, Route } from "react-router-dom";
import Navbar            from "./components/Navbar";
import Home              from "./pages/Home";
import SupervisedModel   from "./pages/SupervisedModel";
import UnsupervisedModel from "./pages/UnsupervisedModel";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/supervised"   element={<SupervisedModel />} />
          <Route path="/unsupervised" element={<UnsupervisedModel />} />
        </Routes>
      </main>
    </>
  );
}
