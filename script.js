class DiscountRule {
  constructor(name) { //it inilise the object 
    this.name = name; // store value of object 
  }

  apply(price) {
    return price;
  }
}

class SeasonalDiscountRule extends DiscountRule {
  constructor(percent) {
    super("SeasonalDiscountRule"); // parent class constructor
    this.percent = percent;
  }

  apply(price) {
    if (typeof this.percent !== "number" || this.percent <= 0 || this.percent > 100) {
      return price; // checks the condition 
    }
    const discounted = price - (price * this.percent / 100);
    return Math.max(discounted, 0); // give largest value and ensure number cannot be negative 
  }
}

class CouponDiscountRule extends DiscountRule {
  constructor(couponValue) {
    super("CouponDiscountRule");
    this.couponValue = couponValue;
  }

  apply(price) {
    if (typeof this.couponValue !== "number" || this.couponValue <= 0) {
      return price;
    }
    return Math.max(price - this.couponValue, 0);
  }
}

class BulkDiscountRule extends DiscountRule {
  constructor(tierPercent) {
    super("BulkDiscountRule");
    this.tierPercent = tierPercent;
  }

  apply(price) {
    if (typeof this.tierPercent !== "number" || this.tierPercent <= 0) {
      return price;
    }
    const discounted = price - (price * this.tierPercent / 100);
    return Math.max(discounted, 0);
  }
}

class Product {
  constructor(name, basePrice, quantity) {
    this.name = name;
    this.basePrice = basePrice;
    this.quantity = quantity;
  }

  getPrice() {
    return this.basePrice;
  }

  setPrice(price) {
    if (typeof price !== "number" || price < 0) return;
    this.basePrice = price;
  }

  getQuantity() {
    return this.quantity;
  }

  setQuantity(quantity) {
    if (typeof quantity !== "number" || quantity < 1) return;
    this.quantity = Math.floor(quantity); // round off to integer
  }

  getTotalPrice() {
    return this.basePrice * this.quantity;
  }
}

class PricingEngine {
  constructor(product) {
    this.product = product;
    this.rules = [];
  }

  addRule(rule) {
    if (rule instanceof DiscountRule) {
      this.rules.push(rule); // add rules into array list
    }
  }

  clearRules() {
    this.rules = [];
  }

  applyRuleChain(price) {
    let result = price;
    this.rules.forEach((rule) => {
      result = rule.apply(result);
    });
    return Math.max(result, 0);
  }

  applySeasonalDiscount(price, percent) {
    const rule = new SeasonalDiscountRule(percent);
    return rule.apply(price);
  }

  applyCouponDiscount(price, couponValue) {
    const rule = new CouponDiscountRule(couponValue);
    return rule.apply(price);
  }

  calculateStackedDiscount(price, percent, coupon) {
    const afterSeasonal = this.applySeasonalDiscount(price, percent);
    const afterCoupon = this.applyCouponDiscount(afterSeasonal, coupon);
    return {
      base: price,
      afterSeasonal: afterSeasonal,
      seasonalSaved: price - afterSeasonal,
      afterCoupon: afterCoupon,
      couponSaved: afterSeasonal - afterCoupon,
      final: afterCoupon,
    };
  }

  compareDiscountStrategies(price, percent, coupon) {
    const seasonalFinal = this.applySeasonalDiscount(price, percent);
    const couponFinal = this.applyCouponDiscount(price, coupon);
    const stacked = this.calculateStackedDiscount(price, percent, coupon);

    const strategies = {
      seasonal: {
        label: "Seasonal Only",
        base: price,
        seasonalSaved: price - seasonalFinal,
        couponSaved: 0,
        final: seasonalFinal,
      },
      coupon: {
        label: "Coupon Only",
        base: price,
        seasonalSaved: 0,
        couponSaved: price - couponFinal,
        final: couponFinal,
      },
      stacked: {
        label: "Stacked Rules",
        base: price,
        afterSeasonal: stacked.afterSeasonal,
        seasonalSaved: stacked.seasonalSaved,
        afterCoupon: stacked.afterCoupon,
        couponSaved: stacked.couponSaved,
        final: stacked.final,
      },
    };

    let bestKey = "seasonal"; 
    let bestFinal = strategies.seasonal.final; // choose which is best 

    if (strategies.coupon.final < bestFinal) {
      bestKey = "coupon";
      bestFinal = strategies.coupon.final;
    }

    if (strategies.stacked.final < bestFinal) {
      bestKey = "stacked";
      bestFinal = strategies.stacked.final;
    }

    return {
      strategies: strategies,
      bestKey: bestKey,
      bestLabel: strategies[bestKey].label,
      bestFinal: bestFinal,
    };
  }

  analyzeBulkSavings(unitPrice, quantity, percent, couponPerUnit) {
    const BULK_TIERS = [0, 3, 5];

    const simulate = (qty, offset) => {
      const totalBase = unitPrice * qty;
      const seasonalRule = new SeasonalDiscountRule(percent);
      const afterSeasonal = seasonalRule.apply(totalBase);
      const seasonalSaved = totalBase - afterSeasonal;

      const scaledCoupon = couponPerUnit * qty;
      const couponRule = new CouponDiscountRule(scaledCoupon);
      const afterCoupon = couponRule.apply(afterSeasonal);
      const couponSaved = afterSeasonal - afterCoupon;

      const tierPercent = BULK_TIERS[offset] || 0;
      const bulkRule = new BulkDiscountRule(tierPercent);
      const afterBulk = bulkRule.apply(afterCoupon);
      const bulkSaved = afterCoupon - afterBulk;

      const finalPrice = Math.max(afterBulk, 0);
      const perUnit = finalPrice / qty;

      return {
        qty: qty,
        totalBase: totalBase,
        afterSeasonal: afterSeasonal,
        seasonalSaved: seasonalSaved,
        afterCoupon: afterCoupon,
        couponSaved: couponSaved,
        tierPercent: tierPercent,
        afterBulk: afterBulk,
        bulkSaved: bulkSaved,
        finalPrice: finalPrice,
        perUnit: perUnit,
      };
    };

    const current = simulate(quantity, 0);
    const plus1 = simulate(quantity + 1, 1);
    const plus2 = simulate(quantity + 2, 2);

    const scenarios = [current, plus1, plus2]; 
    let bestScenario = scenarios[0];
    let isTied = true;

    scenarios.forEach((s) => {
      if (s.perUnit < bestScenario.perUnit) {
        bestScenario = s;
        isTied = false;
      }
    });

    if (isTied) {
      isTied = scenarios.every((s) => Math.abs(s.perUnit - current.perUnit) < 0.001); // find absolute difference 
    }

    return {
      current: current,
      plus1: plus1,
      plus2: plus2,
      bestScenario: bestScenario,
      currentIsBest: bestScenario.qty === current.qty,
      allEqual: isTied,
    };
  }

  calculateFinalPrice(percent, coupon) {
    this.clearRules();
    if (percent > 0) this.addRule(new SeasonalDiscountRule(percent));
    if (coupon > 0) this.addRule(new CouponDiscountRule(coupon));

    const baseTotal = this.product.getTotalPrice();
    const comparison = this.compareDiscountStrategies(baseTotal, percent, coupon);
    const bulk = this.analyzeBulkSavings(
      this.product.getPrice(),
      this.product.getQuantity(),
      percent,
      coupon
    );

    return {
      productName: this.product.name,
      unitPrice: this.product.getPrice(),
      quantity: this.product.getQuantity(),
      baseTotal: baseTotal,
      comparison: comparison,
      bulk: bulk,
      totalSavings: baseTotal - comparison.bestFinal,
    };
  }
}

const Fmt = {
  _inr: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }),
  usd: (v) => Fmt._inr.format(parseFloat(v)),
  saved: (v) => (v > 0 ? `-${Fmt.usd(v)}` : Fmt._inr.format(0)),
};

const $ = (id) => document.getElementById(id);
const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
const setHtml = (id, val) => { const el = $(id); if (el) el.innerHTML = val; };

const toast = {
  _t: null,     // shows temporary notification to user 
  show: (msg) => {
    setText("toastText", msg);
    $("toast").classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => $("toast").classList.remove("show"), 3600);
  },
};

const Validator = {
  ok: true,

  reset: () => {
    Validator.ok = true;
    const fields = ["productName", "productQty", "productPrice", "seasonalPct", "couponVal"];
    const errMap = {
      productName: "err-productName",
      productQty: "err-productQty",
      productPrice: "err-productPrice",
      seasonalPct: "err-seasonal",
      couponVal: "err-coupon",
    };
    fields.forEach((id) => {
      const inp = $(id);
      if (inp) inp.classList.remove("err");
      setText(errMap[id], "");
    });
  },

  fail: (inputId, errId, msg) => {
    const inp = $(inputId);
    if (inp) inp.classList.add("err");
    setText(errId, msg);
    Validator.ok = false;
  },

  name: (val) => {
    if (!val || !val.trim()) {
      Validator.fail("productName", "err-productName", "Product name is required.");
      return null;
    }
    return val.trim();
  },

  price: (val) => {
    if (val === "" || val === null || val === undefined) {
      Validator.fail("productPrice", "err-productPrice", "Unit price is required.");
      return null;
    }
    const n = parseFloat(val);
    if (isNaN(n)) {
      Validator.fail("productPrice", "err-productPrice", "Enter a valid numeric price.");
      return null;
    }
    if (n < 0) {
      Validator.fail("productPrice", "err-productPrice", "Price cannot be negative.");
      return null;
    }
    return n;
  },

  qty: (val) => {
    if (val === "" || val === null || val === undefined) {
      Validator.fail("productQty", "err-productQty", "Quantity is required.");
      return null;
    }
    const n = parseInt(val, 10);
    if (isNaN(n)) {
      Validator.fail("productQty", "err-productQty", "Enter a whole number.");
      return null;
    }
    if (n < 1) {
      Validator.fail("productQty", "err-productQty", "Minimum quantity is 1.");
      return null;
    }
    return n;
  },

  seasonal: (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const n = parseFloat(val);
    if (isNaN(n)) {
      Validator.fail("seasonalPct", "err-seasonal", "Enter a valid percentage.");
      return null;
    }
    if (n < 0) {
      Validator.fail("seasonalPct", "err-seasonal", "Rate cannot be negative.");
      return null;
    }
    if (n > 100) {
      Validator.fail("seasonalPct", "err-seasonal", "Rate cannot exceed 100%.");
      return null;
    }
    return n;
  },

  coupon: (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const n = parseFloat(val);
    if (isNaN(n)) {
      Validator.fail("couponVal", "err-coupon", "Enter a valid coupon value.");
      return null;
    }
    if (n < 0) {
      Validator.fail("couponVal", "err-coupon", "Coupon cannot be negative.");
      return null;
    }
    return n;
  },
};

const BulkSelector = {
  activeSlot: "current",

  handleCardClick: (slot) => {
    const cell = $(`bulk-${slot}`);
    const newQty = parseInt(cell.dataset.qty, 10);
    if (!newQty || newQty < 1) return;
    const qtyInput = $("productQty");
    qtyInput.value = newQty;
    qtyInput.classList.remove("qty-flash");
    void qtyInput.offsetWidth;
    qtyInput.classList.add("qty-flash");
    PreviewUpdater.update();
    BulkSelector.activeSlot = slot;
    App.handleCalculate();
  },

  attachListeners: () => {
    ["current", "plus1", "plus2"].forEach((slot) => {
      const cell = $(`bulk-${slot}`);
      if (cell) {
        cell.addEventListener("click", () => BulkSelector.handleCardClick(slot));
      }
    });
  },

  markCurrentSelected: () => {
    ["current", "plus1", "plus2"].forEach((s) => {
      $(`bulk-${s}`).classList.remove("is-selected-bulk");
    });
    $("bulk-current").classList.add("is-selected-bulk");
    BulkSelector.activeSlot = "current";
  },
};

const Renderer = {
  renderResults: (result) => {
    const { productName, unitPrice, quantity, baseTotal, comparison, bulk, totalSavings } = result;
    const { strategies, bestKey, bestLabel, bestFinal } = comparison;

    setText("resultsTitle", `Results — ${productName}`);
    setText("resultsDesc", "Discount rule chain applied. Three strategies compared to find the best deal.");

    setText("sumProduct", productName);
    setText("sumUnit", Fmt.usd(unitPrice));
    setText("sumQty", `${quantity} unit${quantity !== 1 ? "s" : ""}`);
    setText("sumBase", Fmt.usd(baseTotal));
    setText("sumSaved", totalSavings > 0 ? Fmt.usd(totalSavings) : Fmt._inr.format(0));
    setText("rbtValue", bestLabel);

    const ss = strategies.seasonal;
    setText("ss-base", Fmt.usd(ss.base));
    setText("ss-disc", Fmt.saved(ss.seasonalSaved));
    setText("ss-final", Fmt.usd(ss.final));

    const sc = strategies.coupon;
    setText("sc-base", Fmt.usd(sc.base));
    setText("sc-disc", Fmt.saved(sc.couponSaved));
    setText("sc-final", Fmt.usd(sc.final));

    const st = strategies.stacked;
    setText("st-base", Fmt.usd(st.base));
    setText("st-seasonal", `${Fmt.saved(st.seasonalSaved)} \u2192 ${Fmt.usd(st.afterSeasonal)}`);
    setText("st-coupon", `${Fmt.saved(st.couponSaved)} \u2192 ${Fmt.usd(st.afterCoupon)}`);
    setText("st-final", Fmt.usd(st.final));

    ["stratSeasonal", "stratCoupon", "stratStacked"].forEach((id) => $( id).classList.remove("is-best"));
    ["bestSeasonal", "bestCoupon", "bestStacked"].forEach((id) => $( id).classList.add("hidden"));

    const cardMap = { seasonal: "stratSeasonal", coupon: "stratCoupon", stacked: "stratStacked" };
    const badgeMap = { seasonal: "bestSeasonal", coupon: "bestCoupon", stacked: "bestStacked" };

    $(cardMap[bestKey]).classList.add("is-best");
    $(badgeMap[bestKey]).classList.remove("hidden");

    setText("recName", bestLabel);
    setText("recPrice", Fmt.usd(bestFinal));

    $("card-results").classList.remove("hidden");

    Renderer.renderBulk(bulk);
    Renderer.renderBreakdown(result);
    Renderer.renderComparison(result);

    $("card-results").scrollIntoView({ behavior: "smooth", block: "start" });
  },

  renderBulk: (bulk) => {
    const { current, plus1, plus2, bestScenario, currentIsBest, allEqual } = bulk;

    const fillCell = (scenario, slot) => {
      const cell = $(`bulk-${slot}`);
      if (cell) cell.dataset.qty = scenario.qty;
      setText(`bq-${slot}`, `${scenario.qty}`);
      setText(`bp-${slot}`, Fmt.usd(scenario.finalPrice));
      setText(`bu-${slot}`, Fmt.usd(scenario.perUnit));
      setText(`bseasonal-${slot}`, scenario.seasonalSaved > 0 ? Fmt.saved(scenario.seasonalSaved) : "Not applied");
      setText(`bcoupon-${slot}`, scenario.couponSaved > 0 ? Fmt.saved(scenario.couponSaved) : "Not applied");
      const bulkTierEl = $(`bbulk-${slot}`);
      if (bulkTierEl) {
        bulkTierEl.textContent = scenario.tierPercent > 0
          ? `${Fmt.saved(scenario.bulkSaved)} (${scenario.tierPercent}% tier)`
          : "Not applicable";
      }
      const savingsEl = $(`bsave-${slot}`);
      if (savingsEl) {
        const diff = current.perUnit - scenario.perUnit;
        if (slot === "current") {
          savingsEl.textContent = "Baseline";
          savingsEl.className = "bulk-val mono";
        } else if (diff > 0.001) {
          savingsEl.textContent = `-${Fmt.usd(diff)} / unit`;
          savingsEl.className = "bulk-val mono green-val";
        } else if (diff < -0.001) {
          savingsEl.textContent = `+${Fmt.usd(Math.abs(diff))} / unit`;
          savingsEl.className = "bulk-val mono red-val";
        } else {
          savingsEl.textContent = "No change";
          savingsEl.className = "bulk-val mono";
        }
      }
    };

    fillCell(current, "current");
    fillCell(plus1, "plus1");
    fillCell(plus2, "plus2");

    ["bulk-current", "bulk-plus1", "bulk-plus2"].forEach((id) => {
      $(id).classList.remove("is-best-bulk");
    });

    const slotMap = { [current.qty]: "bulk-current", [plus1.qty]: "bulk-plus1", [plus2.qty]: "bulk-plus2" };
    const bestCellId = slotMap[bestScenario.qty];
    if (bestCellId) $(bestCellId).classList.add("is-best-bulk");

    setText("bulkRecQty", `${bestScenario.qty} unit${bestScenario.qty !== 1 ? "s" : ""}`);
    setText("bulkRecPpu", Fmt.usd(bestScenario.perUnit));

    const noteEl = $("bulkBestNote");
    if (noteEl) {
      if (allEqual) {
        noteEl.textContent = "No discount advantage detected across quantities. Current quantity already provides optimal value.";
        noteEl.classList.remove("hidden");
      } else if (currentIsBest) {
        noteEl.textContent = "Current quantity already provides the lowest cost per unit. No benefit to buying more.";
        noteEl.classList.remove("hidden");
      } else {
        noteEl.classList.add("hidden");
      }
    }

    $("card-bulk").classList.remove("hidden");
    BulkSelector.markCurrentSelected();
  },

  renderBreakdown: (result) => {
    const { unitPrice, quantity, baseTotal, comparison, bulk, totalSavings } = result;
    const { strategies, bestKey } = comparison;
    const bestStrategy = strategies[bestKey];
    const basePrice = unitPrice * quantity;

    setText("bd-base-formula", `${Fmt.usd(unitPrice)} × ${quantity} unit${quantity !== 1 ? "s" : ""}`);
    setText("bd-base", Fmt.usd(basePrice));

    const seasonalSaved = bestStrategy.seasonalSaved || 0;
    const couponSaved = bestStrategy.couponSaved || 0;
    const afterSeasonal = basePrice - seasonalSaved;
    const afterCoupon = afterSeasonal - couponSaved;

    const seasonalRow = $("bd-seasonal-row");
    if (seasonalSaved > 0) {
      setText("bd-seasonal-formula", `${strategies.seasonal.seasonalSaved > 0 ? "Rate applied to total" : "Not applied"}`);
      setText("bd-seasonal", Fmt.saved(seasonalSaved));
      if (seasonalRow) seasonalRow.classList.remove("row-inactive");
    } else {
      setText("bd-seasonal", "Not applied");
      setText("bd-seasonal-formula", "No seasonal discount entered");
      if (seasonalRow) seasonalRow.classList.add("row-inactive");
    }

    const couponRow = $("bd-coupon-row");
    if (couponSaved > 0) {
      setText("bd-coupon", Fmt.saved(couponSaved));
      if (couponRow) couponRow.classList.remove("row-inactive");
    } else {
      setText("bd-coupon", "Not applied");
      if (couponRow) couponRow.classList.add("row-inactive");
    }

    const bulkScenario = bulk.current;
    const bulkSaved = bulkScenario.bulkSaved || 0;
    const bulkRow = $("bd-bulk-row");
    if (bulkSaved > 0) {
      setText("bd-bulk-formula", `${bulkScenario.tierPercent}% tiered bulk discount`);
      setText("bd-bulk", Fmt.saved(bulkSaved));
      if (bulkRow) bulkRow.classList.remove("row-inactive");
    } else {
      setText("bd-bulk-formula", "No bulk tier at current quantity");
      setText("bd-bulk", "Not applicable");
      if (bulkRow) bulkRow.classList.add("row-inactive");
    }

    const finalPrice = Math.max(afterCoupon - bulkSaved, 0);
    setText("bd-final", Fmt.usd(finalPrice));

    const totalSaved = basePrice - finalPrice;
    setText("bd-savings", totalSaved > 0 ? Fmt.usd(totalSaved) : Fmt._inr.format(0));

    $("card-breakdown").classList.remove("hidden");
  },

  renderComparison: (result) => {
    const { baseTotal, comparison } = result;
    const { strategies, bestKey, bestLabel, bestFinal } = comparison;

    const entries = [
      { key: "seasonal", rowId: "comp-seasonal", label: "Seasonal Only", disc: strategies.seasonal.seasonalSaved, final: strategies.seasonal.final },
      { key: "coupon",   rowId: "comp-coupon",   label: "Coupon Only",   disc: strategies.coupon.couponSaved,    final: strategies.coupon.final },
      { key: "stacked",  rowId: "comp-stacked",  label: "Stacked Rules", disc: (strategies.stacked.seasonalSaved || 0) + (strategies.stacked.couponSaved || 0), final: strategies.stacked.final },
    ];

    entries.forEach(({ key, rowId, disc, final }) => {
      const row = $(rowId);
      if (!row) return;
      row.classList.remove("comp-row-best");
      const saved = baseTotal - final;
      setText(`comp-${key}-disc`, disc > 0 ? Fmt.saved(disc) : "—");
      setText(`comp-${key}-saved`, saved > 0 ? Fmt.usd(saved) : Fmt._inr.format(0));
      setText(`comp-${key}-price`, Fmt.usd(final));
      const statusEl = $(`comp-${key}-status`);
      if (statusEl) {
        statusEl.textContent = key === bestKey ? "Best" : "—";
        statusEl.className = key === bestKey ? "comp-td comp-status-best" : "comp-td comp-status-neutral";
      }
    });

    const bestRow = $(`comp-${bestKey}`);
    if (bestRow) bestRow.classList.add("comp-row-best");

    setText("compRecName", bestLabel);
    setText("compRecPrice", Fmt.usd(bestFinal));

    $("card-comparison").classList.remove("hidden");
  },
};

const PreviewUpdater = {
  update: () => {
    const priceRaw = $("productPrice").value;
    const qtyRaw = $("productQty").value;
    const price = parseFloat(priceRaw);
    const qty = parseInt(qtyRaw, 10);
    const formulaEl = $("btbFormula");
    const valueEl = $("btbValue");

    if (!isNaN(price) && price >= 0 && !isNaN(qty) && qty >= 1) {
      const total = price * qty;
      if (formulaEl) formulaEl.textContent = `${Fmt.usd(price)} \u00D7 ${qty} = ${Fmt.usd(total)}`;
      if (valueEl) valueEl.textContent = Fmt.usd(total);
    } else {
      if (formulaEl) formulaEl.innerHTML = "— &times; — = —";
      if (valueEl) valueEl.textContent = Fmt._inr.format(0);
    }
  },
};

const App = {
  init: () => {
    $("btnCalculate").addEventListener("click", App.handleCalculate);
    $("btnReset").addEventListener("click", App.handleReset);

    $("productPrice").addEventListener("input", PreviewUpdater.update);
    $("productQty").addEventListener("input", PreviewUpdater.update);

    const fieldErrMap = {
      productName: "err-productName",
      productPrice: "err-productPrice",
      productQty: "err-productQty",
      seasonalPct: "err-seasonal",
      couponVal: "err-coupon",
    };

    Object.entries(fieldErrMap).forEach(([inputId, errId]) => {
      $(inputId).addEventListener("input", () => {
        $(inputId).classList.remove("err");
        setText(errId, "");
      });
    });

    document.querySelectorAll(".step-nav-item").forEach((item) => {
      item.addEventListener("click", function () {
        document.querySelectorAll(".step-nav-item").forEach((n) => n.classList.remove("active"));
        this.classList.add("active");
      });
    });

    BulkSelector.attachListeners();
  },

  handleCalculate: () => {
    Validator.reset();

    const name = Validator.name($("productName").value);
    const price = Validator.price($("productPrice").value);
    const qty = Validator.qty($("productQty").value);
    const seasonal = Validator.seasonal($("seasonalPct").value);
    const coupon = Validator.coupon($("couponVal").value);

    if (!Validator.ok) {
      toast.show("Please fix the highlighted fields before running the engine.");
      return;
    }

    const product = new Product(name, price, qty);
    const engine = new PricingEngine(product);
    const result = engine.calculateFinalPrice(seasonal, coupon);

    Renderer.renderResults(result);

    if (result.totalSavings > 0) {
      toast.show(`Engine complete. Best: ${result.comparison.bestLabel}. You save ${Fmt.usd(result.totalSavings)}.`);
    } else {
      toast.show("Engine complete. No discounts applied. Showing base total price.");
    }
  },

  handleReset: () => {
    ["productName", "productPrice", "seasonalPct", "couponVal"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "";
    });
    const qtyEl = $("productQty");
    if (qtyEl) qtyEl.value = "1";

    Validator.reset();
    PreviewUpdater.update();

    $("card-results").classList.add("hidden");
    $("card-bulk").classList.add("hidden");
    $("card-breakdown").classList.add("hidden");
    $("card-comparison").classList.add("hidden");

    BulkSelector.activeSlot = "current";

    toast.show("All fields have been cleared and reset.");
  },
};

document.addEventListener("DOMContentLoaded", App.init);
