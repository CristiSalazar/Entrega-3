import { Router } from "express";
import CartDTO from "../dao/DTOs/cart.dto.js";
import TicketDTO from "../dao/DTOs/ticket.dto.js";
import { ticketService, cartService, userService } from "../repositories/index.js";
import Carts from "../dao/mongo/carts.mongo.js";

const router = Router()

const cartMongo = new Carts()

router.get("/", async (req, res) => {
    let result = await cartMongo.get()
    res.send({ status: "success", payload: result })
})

router.post("/", async (req, res) => {
    let { products } = req.body
    const correo = req.body.correo;
    let rolUser = userService.getRolUser(products.owner)
    if(rolUser == 'premium' && correo == products.owner)
    {
        console.log("No es posible agregar")
    }else{
        let cart = new CartDTO({ products })
        let result = await cartService.createCart(cart)
    }
    
    if(result){
        req.logger.info('Carrito creado correctamente');
    }else{
        req.logger.error("Error al crear carrito");
    }
})


router.post("/:cid/purchase", async (req, res) => {
    try {
        let id_cart = req.params.cid;
        const productos = req.body.productos;
        const correo = req.body.correo;
        let cart = cartService.validateCart(id_cart)
        if (!cart) {
            req.logger.error("No se encontró el carrito con el ID proporcionado");
            return { error: "No se encontró el carrito" };
        }
        let validarStock = cartService.validateStock({productos})

        if (validarStock) {
            let totalAmount = await cartService.getAmount({productos})
            const ticketFormat = new TicketDTO({amount:totalAmount, purchaser:correo});
            const result = await ticketService.createTicket(ticketFormat);
        } else {
            req.logger.error("No hay suficiente stock para realizar la compra");
        }
    } catch (error) {
        req.logger.error("Error:" + error.message);
    }
})

export default router