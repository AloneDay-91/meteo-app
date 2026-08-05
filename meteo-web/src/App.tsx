import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function App() {
  return (
    <div className="p-8">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Shadcn check</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge>OK</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
