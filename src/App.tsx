import { BrowserRouter, Routes, Route } from "react-router-dom";
import StockList from "./pages/StockList";
import StockDetail from "./pages/StockDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StockList />} />
        <Route path="/stock/:code" element={<StockDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
