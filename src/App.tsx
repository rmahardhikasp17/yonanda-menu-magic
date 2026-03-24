import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DBProvider } from "@/providers/DBProvider";
import Dashboard from "./pages/Dashboard";
import RoomsPage from "./pages/RoomsPage";
import GuestOrderPage from "./pages/GuestOrderPage";
import DirectOrderPage from "./pages/DirectOrderPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Create router with v7 future flags to silence warnings
const router = createBrowserRouter(
  [
    { path: "/", element: <Dashboard /> },
    { path: "/rooms", element: <RoomsPage /> },
    { path: "/guest-order", element: <GuestOrderPage /> },
    { path: "/direct-order", element: <DirectOrderPage /> },
    { path: "/admin", element: <AdminPage /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DBProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider
          router={router}
          future={{
            v7_startTransition: true,
          }}
        />
      </TooltipProvider>
    </DBProvider>
  </QueryClientProvider>
);

export default App;

