---
title: Select and Approve Bills for Payment
article_id: 15202011444756
section: 03-payables
index: 47
url: https://storis.zendesk.com/hc/en-us/articles/15202011444756-Select-and-Approve-Bills-for-Payment
source: STORIS Help Center (storis.zendesk.com)
---

AccessAccess

Accounting > Payables > Process Checks > Select and Approve Bills for Payment

Tabs: Bill Selection, Bill Approval, Check Review, EFT Review, Virtual Card Review

Use this process to create payments for AP bills. The process covers all aspects of check-run processing including inquiries on printed or pending check runs, and also allows for Electronic Funds Transfers (EFT) and virtual card payments. For payments with a status of Pending (that is, voided or not printed), you can specify an existing check run or EFT, and you can continue processing from the point at which it was saved.

NOTE: Only one pending payment can exist for a bank at a time. That is, for each bank, you must complete the current check run or EFT (if any) before starting another.

Use this area to specify a check run record or EFT batch and display its status.

BankBank

Select the bank for which you want to create a payment. Once a bank is selected, the system checks to see if multiple payment batches are allowed (i.e. Allow Multiple Payment Batches is active in Bank Settings).

If multiple payment batches are allowed and a pending batch exists, the New button becomes active and this field becomes inactive.

Otherwise, for a new payment batch, the Date For New Batch Window appears as a prompt to select the payment date and method; click Save and you are returned to the Select and Approve Bills for Payment process. Once you select a bank, the Date field activates.

Date DateIf you select a bank for which a pending payment exists, the date and time from the existing payment displays and you cannot edit the field. If you select a bank for which no pending payment exists, the Date for New Batch Window window appears, into which you enter the date for the new payment.

Time/CodeTime/Code

This field name changes depending on if Allow Multiple Payment Batches is active in Bank Settings:

If inactive, this field name is 'Time' and:

If you select a bank for which a pending payment exists, the date and time from the existing payment displays and you cannot edit the field. If you select a bank for which no pending payment exists, after you select a date the current time of day displays and you cannot edit the field. For payments using the same bank and payment date, unique times of day allow you to distinguish the payments.

If active, this field name is 'Code'. Enter up to 10 free-text characters for the batch code.

New button New button

This button is active when the selected bank allows multiple payment batches and a pending batch exists. When this button is invoked, the Date for New Batch window opens where the Batch Payment Code field is mandatory.

Type Type

The transaction type displays. Possible types are:

Printed Checks

Electronic Funds Transfer

Status Status

The status of the payment appears. Possible statues are:

Pending - not yet generated

Printed – payment has been generated

Once the information for the header area is complete, the tabs activate. Note that for new payments, only the Bill Selection tab activates.

Total Approved Total Approved

This is a display only field of the total approved bills for payment for all vendors. The total updates automatically as changes are made.

Bill Selection

Use this tab to specify AP bill selection criteria for approval and payment generation.

Vendor Vendor

Specify one or more vendors for whom to create a payment. Use the Search button to choose from the Vendor Cross Reference window or use the Action button to choose from the Multiple Vendor Selection Window. If you leave the field blank, all vendors are selected. If you select all vendors, all vendors are eligible for selection regardless of their Check Print Bank. This field is inactive if you specify one or more Vendor Classes.

NOTE: The refund vendor RFND is not included in a virtual card batch.

Vendor Class Vendor ClassSpecify one or more vendor classes for which you want to create a payment. If you click on the Search button, a list of vendor classes appears from which you can choose. If you click on the Action button, the Multiple Vendor Class Selection Window appears from which you can choose. If you leave the field blank, you select all classes. If you select one or more vendors at the Vendor field, this field inactivates.

Include AP Bills regardless of Default Payment Method Include AP Bills regardless of Default Payment Method

Check this field to allow AP bills to be processed when the selection in the Default Payment Methods field in Vendor Remit To Settings does not match the batch payment method chosen on the Bill Approval tab of this process. The setting is unchecked by default.

Include Payments

Select the bill types you want to include in the payment. You have the following options:

Merchandise

Pending

Expense

Freight

Direct Ship

Customer's Own Material

Special order Non-inventory

Customer Refund - This option is inactive for virtual card payments.

NOTE: For customer refund payments, if no invoice number exists for an AP bill on the payment, the program includes the customer number instead.

The ability to process customer refunds is impacted by the Approve refund bills security setting in Create a User/Group Actions- Payables Security.

Include Credits

Select the credit types you want to include in the payment. You have the following options:

Merchandise

Expense

Freight

Vendor Receivable

Service Warranty

Adjusted Inventory

Exclude Credits

Resulting in Negative Checks Resulting in Negative Checks

To exclude AP bills if they result in a negative payment for the selected vendor, check the box at this field. Otherwise, leave the box blank.

If you check the box at this field, the program totals all the AP bill amounts for each vendor in the payment batch, and if any calculate to a negative payment for a vendor, the program removes all AP bills for that vendor from the Bill Approval grid. In this way, you can prevent negative payments from appearing in the Check/EFT Review grid, thus preventing them from inclusion in the payment.

If using the separate checks feature with the Exclude Bills that Result in Negative Checks option, if a vendor remit-to's total approved amount is positive, negative checks can still appear on a check run. For more information on separate checks, see the

Separate Check field in the Enter/Update Individual Vendor Invoice routine to specify for individual AP bills, or the

Separate Check per Bill field in the Vendor Settings to set a global default for a selected vendor.

NOTE: A warning window appears letting you know which bill resulted in a negative payment. You have the option to click OK and review each additional bill (if any) or click Ignore to ignore subsequent warnings.

Payment Date

Select the payment dates you want to include in the payment. You have the following options:

Select with Date Type as Select with Date Type as

Select the date type. You have the following options:

Due Date - This is the date on which final payment for the invoice is due and is based on Vendor Settings and Terms Settings.

Terms Date - If the terms include a discount, this is the date by which payment must be made in order to be eligible for the discount.

Anticipated Pay Date - This is the expected date of payment, based on the vendor's terms.

Start Start Select the start date of the range of payment dates for the payment. Based on payment date type defined at the Type field, the program selects all AP bills with a date on or after the specified date. If you leave this field blank, the program assumes the earliest possible date.

Cutoff CutoffSelect the cutoff date of the range of payment dates for the payment. Based on payment date type defined at the Type field, the program selects all AP bills with a date on or before the specified date.

Bills With Terms OnlyBills With Terms OnlyTo include only bills with terms discounts specified, check the box. Otherwise, leave the box blank.

Always Take Terms Always Take TermsTo accept the terms discount on all selected bills regardless of whether the payment date falls within the terms period, check the box. Otherwise, leave the box blank.

Select BillsSelect Bills

To perform the initial selection of AP bills for approval, click on this button. A message appears indicating the number of bills selected for processing. If you click OK, the Bill Approval tab becomes active. You can also use this button to select bills if the payment status is Pending (that is, not printed).

If AP bills were selected previously, a message appears asking to append the existing payment batch. You have the following options:

Cancel- you are returned to the main screen

Yes - overwrites the existing bills on the payment batch and new bills are added. Duplicate selections are ignored.

No - Another message displays stating the current selections are to be overwritten and asks to continue.

Note that if you re-select bills, the program overwrites all existing selections and approval information. A warning message appears.

You can click on the Save button anytime after the initial selection of AP bills. The program saves the payment record with a Pending status. You can re-access at any time to continue the payment.

Bill Approval

This tab displays a grid of all AP bills selected based on the criteria specified on the Bill Selection tab. Bills sort by vendor class, vendor remit-to, bill type, invoice number, and either due date, discount date, or anticipated pay date. The grid may be filtered allowing users to see the total approved for a specific vendor or vendor remit-to. The information in the grid is sorted according to the Sort Detail Lines on Stub by on the Advanced tab of Payables Control Settings. The grid contains the following columns:

Bill - AP bill key

Invoice - Vendor invoice. Note that if the AP bill associated with the invoice has been purged, "Unknown" displays in this column.

Remit-To - Remit-To name

Bill Type – Short description

Due/Pay Date - Either the due date or the anticipated pay date appears based on your selection at the Type field on the Bill Selection tab.

Terms Date - selects bills based on terms date.

Amount Due - Signed, credits are negative. The total is displayed at the bottom of the column.

Discount – Signed, always negative. The total is displayed at the bottom of the column.

Approved - Signed, credits are negative. The total is displayed at the bottom of the column.

Edit - To edit or review bill information, click on this button. The Enter/Update Individual Vendor Invoice appears.

Remove - To remove a selected bill from the grid, click on this button.

If you click on a cell in the Approved column, you can update the Approved amount with any value including zero. Entering zero effectively deletes the bill from the grid.

Add BillAdd Bill

To manually add a bill to this check run, click on this button. The Add Bills to Existing Check Run screen appears. When the Include AP Bills Regardless of Default Payment Method setting on the Bill Selection tab is not checked, a message confirms adding this AP bill because it does not match the batch payment method chosen in the Default Payment Methods field in Vendor RemitTo Settings.

NOTE: Any changes you make reflect in the Check Run/Payment process. If you edit a current bill, the program re-qualifies the bill using the current selection criteria specified on the Bill Selection tab. If for any reason the bill has changed so that it no longer matches the selection criteria, a warning message appears. If you say Yes, the program includes the bill in the payment batch. If you say No, the program removes the bill from the payment batch.

Changes to remit-to information can result in new payments and/or the consolidation of existing payments. For example, if you change the check print bank for an AP bill, the program removes the AP bill from the process.

If you enter new selection criteria and choose to append the selected bills to a payment batch, the new selection criteria will overwrite the existing criteria and be used for validating bills. This allows AP bills to have different terms or discounts and exist on the same payment batch.

Check Review

This tab displays a grid of AP checks for printing based on approved bills from the Bill Approval tab. The program consolidates AP bills with the same vendor and vendor remit-to into single checks (except Customer Refund AP Bills, which are never consolidated). To create separate checks, use the Payment Register Maintenance Screen. Checks sort by vendor remit-to, vendor, and payment register key. The grid contains the following columns:

Reference - the payment register key displays. For pending check runs where an AP payment register key has not yet been assigned, the program assigns a temporary reference.

Remit-To – Remit-to Name

Vendor – Vendor Name

Amount - Check Amount

Status

o Pending – in process, not yet printed.

o Printed

o Reconciled

o Voided

Check – Check Number (Printed status only)

To print all checks approved for the current check run, click the Print Checks button.

If the Export Checks field is inactive for the selected bank in the Bank Settings, the Print Checks routine appears. If this field is active, the Export Payable Checks routine appears.

Use the Create Check Run File button to print the check run file for the current check run. Clicking this button brings the user to the Create Check Run File process. This button is inactive if a Check Run File Format has not been specified via the Select Bank Check Run File Format process accessed in Bank Settings.

NOTE: If you double-click on a grid item, the Payment Register Maintenance Screen appears.

This tab is active only if you disable the Process Using Electronic Funds Transfer field on the Date For New Batch Window. When this tab is active, the EFT Review tab is inactive.

To report on a check run, use the Report Payables Disbursement option on the Actions button.

If an approved bill results in a negative payment for any vendor remit-to, the grid highlights the payment and the Print Checks button inactivates. To proceed, you must first address all negative payments.

The Sort Detail Lines on Stub by field in Payables Control Settings determines the sequence in which the AP checks in the grid are displayed.

ActionsActions

Report Payables Disbursement

EFT Review

This tab displays a grid of electronic funds transfer (EFT) batches for printing based on approved bills from the Bill Approval tab. The program consolidates AP bills with the same vendor and vendor remit-to into single batches (except Customer Refund AP Bills, which are never consolidated). To create separate batches, use the Payment Register Maintenance Screen. Batches sort by vendor remit-to, vendor, and payment register key. The grid contains the following columns:

Reference - the payment register key displays. For pending EFT batches where an AP payment register key has not yet been assigned, the program assigns a temporary reference.

Remit-To – Remit-to Name

Vendor – Vendor Name

Amount - Payment Amount

Status

o Pending – in process, not yet printed.

o Printed

o Reconciled

o Voided

EFT – Batch Number

Once the information has been reviewed, click the CREATE EFT File button to create the EFT file.

NOTE: If you double-click on a grid item, the Payment Register Maintenance Screen appears.

This tab is active only you enable the Process Using Electronic Funds Transfer field on the Date For New Batch Window. When this tab is active, the Check Review tab is inactive.

To report on a payment batch, use the Report Payables Disbursement option on the Actions button.

If an approved bill results in a negative payment for any vendor remit-to, the grid highlights the payments and the Create EFT File button inactivates. To proceed, you must first address all negative payments.

ActionsActions

Report Payables Disbursement

To print all checks approved for the current check run, click on this button.

If the Export Checks field is inactive for the selected bank in the Bank Settings, the Print Checks routine appears. If this field is active, the Export Payable Checks routine appears.

The ability to print refunds is impacted by the Print refund checks security setting in Create a User/Group Actions - Payables Security.

Once the information has been reviewed, click this button to create the EFT file.

Virtual Card Review

Entered virtual card batches have a status of pending. When the payment file is created for the virtual card batch, the status changes to transmitted. When the response file is imported, the status changes to completed.

All payments in a virtual card batch must be of the same currency. The Payments to Include check box on the Bill Selection tab is inactive for virtual card payments. The refund vendor RFND is not included in virtual card batches.

NOTE: Another payment batch cannot be created for the same bank until the current batch has been imported and the status is completed--this applies to any payment type (check, EFT, virtual card). A virtual card batch must have had its payment file created, response file imported, and a status of completed before any other payment type for that bank can be processed.

Reference - the payment register key displays. For pending virtual card batches where an AP payment register key has not yet been assigned, the program assigns a temporary reference.

Remit-To – Remit-to Name

Vendor – Vendor Name

Amount - Payment Amount

Status

o Transmitted - included on a payment file, but not redeemed by the vendor

o Completed - redeemed by the vendor

o Voided

Virtual Card Payment Number – Batch Number

NOTE: If you double-click on a grid item, the Payment Review Screen appears.

To report on a payment batch, use the Report Payables Disbursement option on the Actions button below.

If an approved bill results in a negative payment for any vendor remit-to, the grid highlights the payments and the Create EFT File button inactivates. To proceed, you must first address all negative payments.

Grid InformationGrid Information

Click this button to access the Create Payment File page of the Virtual Card Processing process.
