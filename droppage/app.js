const $ = (id) => document.getElementById(id);
const builder = $('builder');
const campaign = $('campaign');

const CHAINS = {
  ethereum: { label: 'Ethereum', chainId: 1, explorer: 'https://etherscan.io/address/' },
  base: { label: 'Base', chainId: 8453, explorer: 'https://basescan.org/address/' },
  arbitrum: { label: 'Arbitrum', chainId: 42161, explorer: 'https://arbiscan.io/address/' },
  optimism: { label: 'Optimism', chainId: 10, explorer: 'https://optimistic.etherscan.io/address/' },
  polygon: { label: 'Polygon', chainId: 137, explorer: 'https://polygonscan.com/address/' },
  solana: { label: 'Solana', explorer: 'https://solscan.io/account/' }
};

function safeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function isValidWallet(network, wallet) {
  if (network === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

function encodeCampaign(data) {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decodeCampaign(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function campaignUrl(data) {
  const base = location.href.split('#')[0];
  return `${base}#c=${encodeCampaign(data)}`;
}

function getPaymentUri(data, amount) {
  const wallet = data.wallet;
  const cleanAmount = Number(amount) > 0 ? Number(amount) : 0;
  if (data.network === 'solana') {
    return cleanAmount ? `solana:${wallet}?amount=${encodeURIComponent(cleanAmount)}` : `solana:${wallet}`;
  }
  if (data.asset === 'ETH') {
    const chainId = CHAINS[data.network]?.chainId;
    if (cleanAmount) {
      const wei = BigInt(Math.round(cleanAmount * 1e9)) * 1000000000n;
      return `ethereum:${wallet}@${chainId}?value=${wei}`;
    }
    return `ethereum:${wallet}@${chainId}`;
  }
  return wallet;
}

function explorerUrl(data) {
  const chain = CHAINS[data.network];
  return `${chain.explorer}${encodeURIComponent(data.wallet)}`;
}

function updateAssetOptions() {
  const network = $('network').value;
  const asset = $('asset');
  if (network === 'solana') {
    asset.innerHTML = '<option value="SOL">SOL</option>';
  } else {
    asset.innerHTML = '<option value="ETH">ETH</option><option value="USDC">USDC</option>';
  }
}

function collectForm() {
  return {
    v: 1,
    image: safeText($('imageUrl').value),
    title: safeText($('title').value),
    description: safeText($('description').value),
    network: $('network').value,
    asset: $('asset').value,
    wallet: safeText($('wallet').value),
    goal: Number($('goal').value || 0),
    suggested: Number($('suggested').value || 0),
    deadline: $('deadline').value || '',
    creator: safeText($('creator').value)
  };
}

function validate(data) {
  if (!data.image.startsWith('https://')) throw new Error('Фото повинно мати HTTPS URL.');
  if (!data.title || !data.description) throw new Error('Додай назву та опис.');
  if (!CHAINS[data.network]) throw new Error('Непідтримувана мережа.');
  if (!isValidWallet(data.network, data.wallet)) throw new Error('Адреса гаманця не схожа на коректну адресу для вибраної мережі.');
  if (!(data.goal > 0)) throw new Error('Ціль збору повинна бути більшою за 0.');
  if (data.network === 'solana' && data.asset !== 'SOL') throw new Error('Для Solana MVP підтримує SOL.');
  if (data.network !== 'solana' && !['ETH', 'USDC'].includes(data.asset)) throw new Error('Для EVM мереж MVP підтримує ETH або USDC.');
}

function render(data) {
  validate(data);
  builder.classList.add('hidden');
  campaign.classList.remove('hidden');

  $('campaignImage').src = data.image;
  $('campaignImage').onerror = () => {
    $('campaignImage').removeAttribute('src');
    $('campaignImage').alt = 'Зображення не завантажилось. Перевір URL обкладинки.';
  };
  $('campaignTitle').textContent = data.title;
  $('campaignDescription').textContent = data.description;
  $('networkBadge').textContent = CHAINS[data.network].label;
  $('assetBadge').textContent = data.asset;
  $('walletText').textContent = data.wallet;
  $('goalText').textContent = `${data.goal} ${data.asset}`;
  $('creatorLine').textContent = data.creator ? `Автор: ${data.creator}` : 'Автор не вказаний';
  $('amountSymbol').textContent = data.asset;
  $('donationAmount').value = data.suggested || '';
  $('deadlineBadge').textContent = data.deadline ? `до ${data.deadline}` : 'без дедлайну';
  $('explorerLink').href = explorerUrl(data);

  const refreshPayment = () => {
    const amount = $('donationAmount').value;
    const uri = getPaymentUri(data, amount);
    $('payLink').href = uri;
    $('payHint').textContent = data.asset === 'USDC'
      ? `USDC: перевір мережу ${CHAINS[data.network].label} у своєму гаманці. Кнопка копіює/відкриває адресу отримувача, без автоматичного контрактного переказу.`
      : `Платіж піде напряму на адресу автора в мережі ${CHAINS[data.network].label}.`;
    const qr = $('qrcode');
    qr.innerHTML = '';
    if (window.QRCode) new QRCode(qr, { text: uri, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.M });
  };

  $('donationAmount').oninput = refreshPayment;
  refreshPayment();

  $('copyWallet').onclick = async () => {
    await navigator.clipboard.writeText(data.wallet);
    flashButton($('copyWallet'), 'Скопійовано');
  };

  $('copyLink').onclick = async () => {
    await navigator.clipboard.writeText(campaignUrl(data));
    flashButton($('copyLink'), 'Link скопійовано');
  };

  $('shareCampaign').onclick = async () => {
    const url = campaignUrl(data);
    const shareData = { title: data.title, text: `${data.title} - підтримати криптою`, url };
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(url);
      flashButton($('shareCampaign'), 'Link скопійовано');
    }
  };

  document.title = `${data.title} - DropPage`;
  history.replaceState(null, '', `#c=${encodeCampaign(data)}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function flashButton(button, text) {
  const old = button.textContent;
  button.textContent = text;
  setTimeout(() => button.textContent = old, 1400);
}

$('campaignForm').addEventListener('submit', (event) => {
  event.preventDefault();
  try { render(collectForm()); }
  catch (error) { alert(error.message); }
});

$('network').addEventListener('change', updateAssetOptions);
$('newCampaign').addEventListener('click', () => {
  history.replaceState(null, '', location.href.split('#')[0]);
  campaign.classList.add('hidden');
  builder.classList.remove('hidden');
  document.title = 'DropPage - одноразові крипто-донати';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('loadDemo').addEventListener('click', () => {
  $('imageUrl').value = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=85';
  $('title').value = 'Milady Moto Concept';
  $('description').value = 'Експериментальний кастомний мотоцикл у стилі digital collectible culture. Донати підуть на візуальні концепти, деталі та перший фізичний прототип.';
  $('network').value = 'base';
  updateAssetOptions();
  $('asset').value = 'ETH';
  $('wallet').value = '0x1111111111111111111111111111111111111111';
  $('goal').value = '2';
  $('suggested').value = '0.01';
  $('creator').value = '@creator';
});

(function boot() {
  updateAssetOptions();
  const match = location.hash.match(/^#c=(.+)$/);
  if (!match) return;
  try {
    const data = decodeCampaign(match[1]);
    render(data);
  } catch (error) {
    history.replaceState(null, '', location.href.split('#')[0]);
    alert(`Не вдалося відкрити кампанію: ${error.message}`);
  }
})();