const http = require("http");
const { Server } = require("socket.io");

const {
  findWaiterByTableId,
  updateWaiterSocketId,
} = require("../controllers/socketController");

module.exports = function (app) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONT_END_PORT, process.env.FRONT_END_PORT1],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // When a waiter logs in, they should emit a 'login' event with their user ID
    socket.on("login", async (userId) => {
      // Update the waiter's record in the database with their socket ID
      await updateWaiterSocketId(userId, socket.id);
    });

    // Listen for 'order' events
    socket.on(
      "orders",
      async ({
        orders,
        tableID,
        orderId,
        specialInstructions,
        totalAmount,
      }) => {
        console.log("Received orders event:", {
          orders,
          tableID,
          orderId,
          specialInstructions,
          totalAmount,
        });
        try {
          // Find the waiter and manager assigned to the table ID
          const waiter = await findWaiterByTableId(tableID);

          // Emit an 'order' event to the waiter with the order details
          io.to(waiter.socketId).emit("orders", {
            orderId,
            cartItems: orders,
            tableID,
            specialInstructions,
            totalAmount,
          });

          // Emit a separate 'managerOrders' event to all connected clients (including the manager)
          io.emit("managerOrders", {
            orderId,
            cartItems: orders,
            tableID,
            specialInstructions,
            totalAmount,
          });
        } catch (error) {
          console.error(error);
        }
      }
    );
    // Listen for 'confirm' events
    socket.on("confirm", async (order) => {
      // Emit a 'confirmOrder' event to the kitchen staff with the order details
      io.emit("confirmOrder", { orderId: order.orderId, ...order });
    });
    // Listen for 'mealPreparationStarted' events
    socket.on("mealPreparationStarted", async (order) => {
      // Emit a 'mealPreparationStarted' event to all connected clients with the order details
      //  io.emit("mealPreparationStarted", order);
      io.emit("mealPreparationStarted", { orderId: order.orderId, ...order });
    });
    //Listen for 'orderReady' events
    socket.on("orderReady", async (order) => {
      // Emit a 'orderReady' event to all connected clients with the order details
      //  io.emit("orderReady", order);
      io.emit("orderReady", { orderId: order.orderId, ...order });
    });
  });

  return server;
};
