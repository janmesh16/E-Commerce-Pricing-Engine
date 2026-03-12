PricingEngine v3.0 — E-Commerce Discount Strategy System
A rule-based e-commerce pricing calculator built with vanilla JavaScript ES6 OOP. Applies sequential discount rules, compares three pricing strategies, analyzes bulk savings, and recommends the optimal purchase quantity — all formatted in Indian Rupees (₹).

Table of Contents

Overview
Features
Project Structure
How to Run
How to Use
Class Architecture
Discount Logic
Bulk Savings Analyzer
Currency Formatting
UI and Design
Technologies Used
Academic Context


Overview
PricingEngine is a single-page web application that automates the calculation and comparison of e-commerce discount strategies. Given a product name, unit price, quantity, seasonal discount rate, and coupon value, the engine processes inputs through a class-based rule chain and returns a full pricing analysis including strategy comparison, bulk savings simulation, and an invoice-style price breakdown.

Features

Rule Chain Engine — Applies SeasonalDiscountRule, CouponDiscountRule, and BulkDiscountRule sequentially using ES6 class inheritance
Three-Strategy Comparison — Independently calculates Seasonal Only, Coupon Only, and Stacked Rules to identify the lowest final price
Bulk Savings Analyzer — Simulates pricing at current quantity, +1, and +2 with tiered bulk discounts and per-unit coupon scaling; cards are clickable to update quantity and re-run the engine continuously
Price Breakdown — Invoice-style card showing the step-by-step calculation chain with each discount deducted in sequence
Strategy Comparison Chart — Table view comparing all three strategies with savings, final price, and best status highlighted
Live Base Total Preview — Updates dynamically as the user types price and quantity before running the engine
Reset / Clear Calculator — One-click reset that clears all inputs and hides all result cards
Indian Rupee Formatting — All monetary values use Intl.NumberFormat with en-IN locale and INR currency
Responsive Design — Fully responsive across desktop, tablet, and mobile at breakpoints of 1200px, 960px, and 700px
Background Image with Overlay — AI and e-commerce themed background with frosted glass UI elements


Project Structure
pricing-engine-v3/
│
├── index.html               — Application structure and all card layouts
├── styles.css               — Complete styling, design tokens, animations, responsive rules
├── script.js                — All JavaScript classes, logic, rendering, and event handling
└── price_engine_pic_1.jpeg  — Background image for the dashboard
All four files must be kept in the same folder. Open index.html directly in any modern browser — no build step, no server, no dependencies.

How to Run

Download or unzip the project folder
Ensure all four files are in the same directory
Open index.html in a modern browser (Chrome, Firefox, Edge, or Safari)
No installation, no npm, no server required


How to Use
Step 1 — Product Setup
Enter the product name, unit price in rupees, and the quantity you intend to purchase. The base total preview bar updates live as you type.
Step 2 — Discount Rules
Enter an optional seasonal discount percentage and an optional flat coupon value in rupees. Either or both can be left blank or set to zero.
Step 3 — Run the Engine
Click the Run Pricing Engine button. The engine validates all inputs, runs the full calculation pipeline, and reveals four result cards simultaneously.
Step 4 — Read the Results

Strategy Analysis (Card 03) — See which of the three strategies gives the best price
Bulk Savings Analyzer (Card 04) — Click any quantity card to update the quantity and re-run the analyzer continuously
Price Breakdown (Card 05) — See the full invoice-style step-by-step deduction chain
Strategy Comparison Chart (Card 06) — Review all three strategies in a tabular format

Step 5 — Reset
Click Clear Calculator to reset all fields and return the interface to its initial state.

Class Architecture
DiscountRule                    (base class)
├── SeasonalDiscountRule        (extends DiscountRule)
├── CouponDiscountRule          (extends DiscountRule)
└── BulkDiscountRule            (extends DiscountRule)

Product                         (encapsulates name, basePrice, quantity)
PricingEngine                   (accepts Product, manages rule chain and all calculations)
All discount rules extend the DiscountRule base class and override the apply(price) method. This allows the PricingEngine to execute any combination of rules through a single applyRuleChain(price) loop without modifying the core engine logic.

Discount Logic
Seasonal Discount
afterSeasonal = price - (price × seasonalPercent / 100)
Coupon Discount
afterCoupon = afterSeasonal - couponValue
The coupon is scaled by quantity in the Bulk Savings Analyzer so that the per-unit benefit remains constant across all simulated quantities.
Bulk Tier Discount (applied in Bulk Savings Analyzer only)
Current quantity  →  0% additional discount
Quantity + 1      →  3% additional discount
Quantity + 2      →  5% additional discount
Stacked Strategy Order
Base Price  →  Seasonal  →  Coupon  →  Bulk Tier  →  Final Price
All prices are floored at ₹0.00 — no result can return a negative value.

Bulk Savings Analyzer
Each quantity scenario is computed entirely independently:

Total base price is calculated as unit price multiplied by the simulated quantity
Seasonal discount is applied to the total
Coupon is scaled by quantity and deducted
Tiered bulk discount is applied based on the offset (0%, 3%, or 5%)
Cost per unit is computed as final price divided by simulated quantity

The scenario with the lowest cost per unit is marked as the best value recommendation. If no cost advantage exists across quantities, a note informs the user that the current quantity is already optimal.
Clicking a bulk card writes that card's quantity into the input field via its data-qty attribute and re-runs the full engine, making the analyzer continuous and exploratory.

Currency Formatting
All monetary values in the application are formatted using the JavaScript Internationalization API:
jsnew Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
This produces correctly structured Indian Rupee output with the ₹ symbol and Indian comma grouping — for example ₹1,23,456.00 — across all display points in the interface.

UI and Design

Fonts — Archivo Narrow (headings), Archivo (body), JetBrains Mono (code and numbers), loaded via Google Fonts
Color System — Defined entirely through CSS custom properties in the :root block covering navy backgrounds, blue accents, teal for bulk elements, amber for seasonal, green for savings, rose for the comparison chart
Background — price_engine_pic_1.jpeg applied with background-size: cover, background-attachment: fixed, and a body::before pseudo-element dark gradient overlay for dashboard readability
Glassmorphism — Header, sidebar, and footer use rgba backgrounds with backdrop-filter: blur() for a frosted glass effect against the background image
Animations — popIn keyframe for card entrance, qtyFlash keyframe for the quantity input when a bulk card is clicked
No inline styles or inline JavaScript anywhere in index.html


Technologies Used
TechnologyPurposeHTML5Semantic document structure and all card layoutsCSS3Styling, layout (Flexbox and Grid), animations, responsive designJavaScript ES6Classes, inheritance, modules, template literals, arrow functionsIntl.NumberFormatIndian Rupee currency formattingGoogle FontsArchivo Narrow, Archivo, JetBrains Mono typefacesCSS Custom PropertiesDesign token system for colors, spacing, and typographyCSS backdrop-filterFrosted glass effect on header, sidebar, and footer
No external JavaScript libraries, frameworks, or build tools are used. The entire application runs directly in the browser from static files.

Academic Context
Course — Computer Science Year 2 Academic Project
Topic — Object-Oriented Programming in JavaScript / Web Application Development
Concepts Demonstrated

ES6 class syntax and constructor methods
Inheritance using the extends keyword and super() calls
Method overriding (apply() method across all rule subclasses)
Encapsulation (Product class with getters and setters)
Modular code organization (classes, utility objects, renderer, validator, app controller)
Event-driven programming (input listeners, click handlers, DOMContentLoaded)
DOM manipulation without frameworks
Separation of concerns across three files with no inline code

