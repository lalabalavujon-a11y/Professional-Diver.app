import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router, Switch } from "wouter";
import Dashboard from "./pages/dashboard";
import SalvageList from "./pages/salvage/salvage-list";
import SalvageDetail from "./pages/salvage/salvage-detail";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/salvage" component={SalvageList} />
          <Route path="/salvage/:id" component={SalvageDetail} />
          <Route>
            <div className="container mx-auto p-6">
              <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            </div>
          </Route>
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
