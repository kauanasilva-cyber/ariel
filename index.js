/* global dscc, mermaid */
const DEFAULT_SAMPLE = `flowchart LR
A[Pedido] --> B{Pagamento}
B -- Aprovado --> C[Separação]
B -- Recusado --> D[Contato com cliente]
C --> E[Envio]
E --> F[Entregue]`;

function getStyleVal(message, id, fallback) {
  const s = message.style || {};
  const item = (s[id] && s[id].value) != null ? s[id].value : fallback;
  return item;
}

function getFromField(message) {
  const tables = message.tables || {};
  const rows = (tables.DEFAULT && tables.DEFAULT.rows) || [];
  if (!rows.length) return null;
  const first = rows[0];
  const cell = Array.isArray(first) ? first[0] : first["diagram"];
  return typeof cell === "object" && cell && "rawValue" in cell ? cell.rawValue : cell;
}

function getFromParam(message, paramName) {
  const params = (message.interactiveState && message.interactiveState.parameters) || {};
  const found = params[paramName];
  if (!found) return null;
  return typeof found === "object" && "value" in found ? found.value : found;
}

function render(message) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  const theme = getStyleVal(message, "theme", "default");
  const fontSize = Number(getStyleVal(message, "fontSize", 14));
  const scale = Number(getStyleVal(message, "scale", 1.0));
  const sourceMode = getStyleVal(message, "sourceMode", "FIELD");
  const paramName = getStyleVal(message, "paramName", "");

  let code = sourceMode === "PARAM"
    ? getFromParam(message, paramName)
    : getFromField(message);

  if (!code || typeof code !== "string") {
    code = DEFAULT_SAMPLE;
  }

  mermaid.initialize({
    startOnLoad: false,
    theme,
    fontSize: `${fontSize}px`,
    securityLevel: "loose"
  });

  const container = document.createElement("div");
  container.className = "mermaid";
  const uid = "mmd-" + Math.random().toString(36).slice(2);

  try {
    const wrapper = document.createElement("div");
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = "top left";
    mermaid.render(uid, code).then(({ svg }) => {
      wrapper.innerHTML = svg;
      container.appendChild(wrapper);
      root.appendChild(container);
    }).catch(err => {
      container.textContent = "Erro ao renderizar Mermaid: " + err.message;
      root.appendChild(container);
    });
  } catch (e) {
    container.textContent = "Erro na visualização: " + e.message;
    root.appendChild(container);
  }
}

dscc.subscribeToData(render, { transform: dscc.objectTransform });
