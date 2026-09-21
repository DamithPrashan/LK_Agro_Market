export const complaintReasonKeys = Object.freeze({
  "Crop quality does not match listing": "complaints.reasonOption1",
  "Wrong Quantity": "complaints.reasonOption3",
  "Damaged Product": "complaints.reasonOption4",
  "Misleading Listing or Agreement Information": "complaints.reasonMisleading",
  "Payment or Order Status Issue": "complaints.reasonPaymentOrder",
  "Harvest Delay": "complaints.harvestDelay",
  "Cultivation Start Delay": "complaints.cultivationStartDelay",
  "Other Platform Transaction Issue": "complaints.reasonOtherPlatform",
});

export const complaintCategoryKeys = Object.freeze({
  payment_issue: "admin.complaints.categories.payment_issue",
  incomplete_order: "admin.complaints.categories.incomplete_order",
  fake_listing: "admin.complaints.categories.fake_listing",
  quality_issue: "admin.complaints.categories.quality_issue",
  delivery_issue: "admin.complaints.categories.delivery_issue",
  system_issue: "admin.complaints.categories.system_issue",
  other: "admin.complaints.categories.other",
});

export const localizeComplaintReason = (reason, t) => {
  const key = complaintReasonKeys[reason];
  return key ? t(key) : reason;
};

export const localizeComplaintCategory = (category, t) => {
  const key = complaintCategoryKeys[category];
  return key ? t(key) : category;
};
