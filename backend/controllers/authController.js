const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Secret = process.env.SECRET_KEY || 'secret';

exports.register = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password )
            return res.status(400).json({message: "Email et mot de passe requis."});

        // verifier si l'email est déja pris
        const existing = await pool.query("SELECT id FROM users WHERE email=$1",[email]);
        if(existing.rows.length > 0)
            return res.status(400).json({message: "Email déja utilisé."});

        // hashage du mot de passe
        const hash = await bcrypt.hash(password, 10);
        
        // insertion du nouvel utilisateur dans la base de données
        const result = await pool.query("INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING id, email, role", [email, hash]);

        res.status(201).json(result.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Erreur serveur."});
    }

};

exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

        if(result.rows.length === 0)
            return res.status(401).json({message: "Email ou mot de passe incorrect."});

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if(!valid)
            return res.status(401).json({message: "Email ou mot de passe incorrect."});

        const token = jwt.sign({id: user.id, role: user.role},
            Secret,
            {expiresIn: "1h"}
        );

        res.json({
            token,
            user: {id: user.id, email: user.email, role: user.role}
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message : "Erreur serveur."});
    }
};

exports.me = async (req, res) => {
    try{
        const result = await pool.query(
            "SELECT id, email, role FROM users WHERE id=$1",
            [req.user.id]
        );

        if (result.rows.length === 0) return res.sendStatus(400);

        res.json(result.rows[0]);
    } catch(err) {
        res.status(500).json({message: "Erreur serveur."});
    }
};