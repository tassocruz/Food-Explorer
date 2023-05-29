//Imports
const knex = require("../database/knex");
const AppError = require("../utils/AppError");
const DiskStorage = require("../providers/DiskStorage");
 
class MealsController {
  async create (request, response) {
    const { title, description, category, price, ingredients } = request.body;
    
    const checkMealExists = await knex("meals").where({title}).first();

    if(checkMealExists) {
      throw new AppError("Esse prato já está cadastrado!")
    }

    const imageFileName = request.file.filename;
    const diskStorage = new DiskStorage()
    const filename = await diskStorage.saveFile(imageFileName);

   
    const meal_id = await knex("meals").insert({
        image: filename,
        title,
        description,
        price,
        category,
    });

    const oneIngredient = typeof(ingredients) === "string";
    let ingredientsInsert;

    if (oneIngredient) {
        ingredientsInsert = {
            name: ingredients,
            meal_id: meal_id[0]
        }

    } else if (ingredients.length > 1) {
        ingredientsInsert = ingredients.map(name => {
            return {
                name,
                meal_id
            }
        });
    }

    await knex("ingredients").insert(ingredientsInsert);

    return response.status(201).json(); 
  }

  async update (request, response) {
    const { title, description, category, price, ingredients } = request.body;
    const {id} = request.params

    const meal = await knex("meals").where({ id }).first();

    const imageFileName = request.file.filename;
    const diskStorage = new DiskStorage();

    if(meal.image) {
      await diskStorage.deleteFile(meal.image);
    }

    const filename = await diskStorage.saveFile(imageFileName);

    meal.image = filename;
    meal.title = title ?? meal.title;
    meal.description = description ?? meal.description;
    meal.category = category ?? meal.category;
    meal.price = price ?? meal.price;

    await knex("meals").where({ id }).update(meal);
    await knex("meals").where({ id }).update('updated_at', knex.fn.now());

    const oneIngredient = typeof(ingredients) === "string";

    let ingredientsInsert;
    if (oneIngredient) {
      ingredientsInsert = {
        name: ingredients,
        meal_id: meal.id
      }
    } else if (ingredients.length > 1) {
      ingredientsInsert = ingredients.map(ingredient => {
        return{
          name: ingredient,
          meal_id: meal.id
        }
      });
    }

    await knex("ingredients").where({meal_id: id}).delete();
    await knex("ingredients").where({meal_id: id}).insert(ingredientsInsert);

    return response.status(200).json();
  }

  async show (request, response) {
    const {id} = request.params;

    const meal = await knex("meals").where({id}).first();
    const ingredients = await knex("ingredients").where({meal_id: id}).orderBy("name");
    
    return response.json({
      ...meal,
      ingredients
    });
  }

  async delete (request, response) {
    const {id} = request.params;

    await knex("meals").where({id}).delete();

    return response.json();
  }

  async index (request, response) {
    const {title, ingredients} = request.query;

    let meals;

    if(ingredients) {
      const filterIngredients = ingredients.split(',').map(ingredient => ingredient.trim());
      
      meals = await knex("ingredients")
      .select([
        "meals.id", "meals.title", "meals.description", "meals.category", "meals.price", "meals.image"
      ])
      .whereLike("meals.title", `%${title}%`)
      .whereIn("title", filterIngredients)
      .innerJoin("meals", "meals.id", "ingredients.meals_id")
      .orderBy("meals.title")
    }

    else if (title) {
      meals = await knex("meals").whereLike("meals.title", `%${title}%`).orderBy("title")
    }

    else {
      meals = await knex("meals").orderBy("title")
    }

    const mealsIngredients = await knex("ingredients")
    const mealsWithIngredients = meals.map(meal => {
      const mealIngredient = mealsIngredients.filter(ingredient => ingredient.meal_id === meal.id);

      return{
        ...meal,
        ingredients: mealIngredient
      }
    });

    return response.json(mealsWithIngredients);
  }
  
}

module.exports = MealsController