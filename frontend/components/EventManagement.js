import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PaymentButton from "@/components/PaymentButton";

const mockEvents = [
  { id: 1, name: "Web Development Bootcamp", date: "2023-08-01", price: 500, description: "A comprehensive bootcamp on web development." },
  { id: 2, name: "Data Science Workshop", date: "2023-08-10", price: 300, description: "A workshop on data science fundamentals." }
];

const EventManagement = ({ shortUniName }) => {
  const [events, setEvents] = useState(mockEvents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [shortUniName]);

  if (loading) {
    return <div className="text-center py-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Management</CardTitle>
        <CardDescription>Manage and track paid events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className ="border p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.date}</p>
                  <p className="text-sm mt-2">{event.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Location: {event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Price: ${event.price}</span>
                </div>
              </div>
              <PaymentButton amount={event.price} email="user@example.com" event={event} />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Create New Event</Button>
      </CardFooter>
    </Card>
  );
};

export default EventManagement;