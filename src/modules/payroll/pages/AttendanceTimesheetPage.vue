<template>
  <div class="attendance-page q-pa-md">
    <div class="row items-start justify-between q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm">
        <div class="row items-center q-gutter-xs text-caption text-primary text-weight-medium q-mb-xs">
          <q-icon name="work_history" size="16px" />
          <span>Payroll run</span>
        </div>
        <div class="text-h4 text-weight-bold">Payroll Run</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Review payroll timesheets · Resolve exceptions first, then approve clean employee timesheets.
        </div>
      </div>
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to complete the request</div>
      <div class="text-caption">{{ error }}</div>
    </q-banner>

    <q-stepper
      v-model="payrollStep"
      flat
      bordered
      animated
      header-nav
      color="primary"
      class="payroll-run-stepper"
    >
      <q-step
        name="period"
        title="Pay period"
        icon="event"
        :done="payrollStep === 'import' || payrollStep === 'review' || payrollStep === 'summary' || payrollStep === 'process'"
      >
        <q-card flat bordered class="payroll-run-card">
          <q-card-section>
            <div class="row items-start q-col-gutter-lg">
              <div class="col-12 col-lg-5">
                <div class="text-overline text-primary">Step 1</div>
                <div class="text-h6 text-weight-bold">Select payroll run period</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Select the pay period group first, then choose the payroll period to run.
                </div>

                <PayPeriodGroupSelect
                  class="q-mt-md"
                  :model-value="selectedPayPeriodGroupId"
                  label="Pay period group"
                  :clearable="false"
                  :show-add-new="false"
                  :show-edit="false"
                  @update:model-value="void onSelectedPayPeriodGroupUpdate($event)"
                />

                <q-select
                  class="q-mt-md"
                  :model-value="selectedPayPeriodId"
                  outlined
                  emit-value
                  map-options
                  label="Payroll run pay period"
                  :loading="isLoadingPayRunSetup"
                  :options="payPeriodOptions"
                  :disable="!selectedPayPeriodGroupId"
                  @update:model-value="void onSelectedPayPeriodUpdate(($event as string | null) ?? null)"
                >
                  <template #prepend><q-icon name="date_range" /></template>
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                        <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-chip
                          dense
                          :color="scope.opt.processed ? 'grey-3' : 'blue-1'"
                          :text-color="scope.opt.processed ? 'grey-8' : 'primary'"
                          :label="scope.opt.statusLabel"
                        />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-lg-7">
                <q-banner
                  v-if="selectedPeriodProcessed"
                  rounded
                  class="bg-grey-2 text-grey-9 q-mb-md"
                >
                  <template #avatar><q-icon name="lock" /></template>
                  This pay period has already been processed. It can be reviewed here, but automatic recalculation will not update it.
                </q-banner>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <SsBenefitDateField
                      v-model="payPeriodEdit.startDate"
                      label="Start date"
                      required
                      :disable="!selectedPayPeriodId"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <SsBenefitDateField
                      v-model="payPeriodEdit.endDate"
                      label="End date"
                      required
                      :disable="!selectedPayPeriodId"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <SsBenefitDateField
                      v-model="payPeriodEdit.payDate"
                      label="Pay date"
                      required
                      :disable="!selectedPayPeriodId"
                    />
                  </div>
                </div>

                <div class="row items-center justify-between q-mt-md q-gutter-sm">
                  <q-chip
                    :color="selectedPeriodProcessed ? 'grey-3' : 'blue-1'"
                    :text-color="selectedPeriodProcessed ? 'grey-8' : 'primary'"
                    :icon="selectedPeriodProcessed ? 'task_alt' : 'pending_actions'"
                    :label="selectedPeriodStatusLabel"
                  />
                  <div class="row q-gutter-sm">
                    <q-btn
                      outline
                      color="primary"
                      icon="save"
                      label="Save period"
                      :disable="!selectedPayPeriodId || selectedPeriodProcessed"
                      :loading="payPeriodScheduleStore.isLoading"
                      @click="savePayPeriod"
                    />
                    <q-btn
                      color="primary"
                      icon-right="arrow_forward"
                      label="Continue to review"
                      :disable="!selectedPayPeriodId"
                      @click="goToReviewStep"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-step>

      <q-step
        name="review"
        title="Accountant review"
        icon="fact_check"
        :done="payrollStep === 'import' || payrollStep === 'summary' || payrollStep === 'process'"
      >
        <div class="row items-center justify-between q-col-gutter-md q-mb-md">
          <div class="col-12 col-md">
            <div class="text-h6 text-weight-bold">Accountant review queue</div>
            <div class="text-body2 text-grey-7">
              Resolve exceptions and approve employee period summaries for the selected payroll run.
            </div>
          </div>
          <div class="col-12 col-md-auto row q-gutter-sm justify-end">
            <q-btn
              flat
              color="primary"
              icon="arrow_back"
              label="Change period"
              @click="payrollStep = 'period'"
            />
            <q-btn
              outline
              color="primary"
              icon="calculate"
              label="Recalculate all"
              :loading="isRecalculatingCompensation"
              @click="confirmRecalculateAll"
            />
            <q-btn
              unelevated
              color="primary"
              icon-right="arrow_forward"
              label="Continue to import"
              @click="goToImportStep"
            />
            <q-btn
              unelevated
              color="primary"
              icon="refresh"
              label="Refresh data"
              :loading="isLoadingEmployeeSummaries"
              @click="refreshTimesheets"
            />
          </div>
        </div>

        <q-card flat bordered class="payroll-run-card q-mb-md">
          <q-card-section class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <div class="queue-stat">
                <q-icon name="warning_amber" color="warning" size="24px" />
                <div>
                  <div class="text-caption text-grey-7">Exceptions</div>
                  <div class="text-h6 text-weight-bold">{{ timesheetSummary.issueCount }}</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <div class="queue-stat">
                <q-icon name="hourglass_empty" color="primary" size="24px" />
                <div>
                  <div class="text-caption text-grey-7">Pending</div>
                  <div class="text-h6 text-weight-bold">{{ timesheetSummary.pendingCount }}</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <div class="queue-stat">
                <q-icon name="task_alt" color="positive" size="24px" />
                <div>
                  <div class="text-caption text-grey-7">Approved</div>
                  <div class="text-h6 text-weight-bold">{{ timesheetSummary.approvedCount }}</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3 text-sm-right">
              <q-btn
                v-if="timesheetIssueCount > 0"
                unelevated
                color="warning"
                text-color="white"
                icon="warning_amber"
                :label="`Review ${timesheetIssueCount} exceptions`"
                @click="reviewTimesheetIssues"
              />
              <q-chip v-else color="green-1" text-color="positive" icon="task_alt" label="No exceptions in current view" />
            </div>
          </q-card-section>
        </q-card>

        <attendance-timesheets-tab
          :filter="timesheetFilter"
          :pay-periods="filteredPayPeriods"
          :employee-summaries="employeeTimesheetSummaries"
          :summary="timesheetSummary"
          :is-loading-timesheets="isLoadingEmployeeSummaries"
          :is-loading-pay-periods="isLoadingPayPeriods"
          :pagination="employeeSummaryPagination"
          :last-page="timesheetLastPage"
          @update:filter="onTimesheetFilterUpdate"
          @apply-filter="applyTimesheetFilter"
          @reset-filter="resetTimesheetFilter"
          @load-page="loadTimesheets"
          @review-issues="reviewTimesheetIssues"
          @view-details="openEmployeeDetails"
        />
      </q-step>

      <q-step
        name="import"
        title="Allowances & deductions"
        icon="upload_file"
        :done="payrollStep === 'summary' || payrollStep === 'process'"
      >
        <q-card flat bordered class="payroll-run-card q-mb-md">
          <q-card-section>
            <div class="row items-start q-col-gutter-lg">
              <div class="col-12 col-lg-5">
                <div class="text-overline text-primary">Step 3</div>
                <div class="text-h6 text-weight-bold">Upload allowances and deductions</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Upload an Excel or CSV file with employee id, employee name, then repeating columns for code, date, quantity, and rate.
                  Negative quantities are treated as deductions.
                </div>

                <q-file
                  class="q-mt-md"
                  outlined
                  clearable
                  accept=".csv,.xls,.xlsx"
                  :model-value="importFile"
                  label="Allowance and deduction file"
                  :disable="!selectedPayPeriodId || selectedPeriodProcessed"
                  @update:model-value="void handleImportFile(($event as File | null) ?? null)"
                >
                  <template #prepend><q-icon name="upload_file" /></template>
                </q-file>

                <AccountSelect
                  v-if="blankImportRowCount > 0"
                  class="q-mt-md"
                  :model-value="blankImportAccountId"
                  label="Account for blank account codes"
                  clearable
                  :disable="selectedPeriodProcessed"
                  @update:model-value="void onBlankImportAccountUpdate($event)"
                />

                <q-banner
                  v-if="hasUnassignedBlankImportAccounts"
                  rounded
                  class="bg-amber-1 text-amber-10 q-mt-md"
                >
                  <template #avatar><q-icon name="account_balance" /></template>
                  {{ unassignedBlankImportRowCount }} imported row{{ unassignedBlankImportRowCount === 1 ? '' : 's' }} ha{{ unassignedBlankImportRowCount === 1 ? 's' : 've' }} quantity, date, and rate but no account code. Select one account to apply to all blank account rows.
                </q-banner>

                <q-banner
                  v-if="!selectedPayPeriodId"
                  rounded
                  class="bg-amber-1 text-amber-10 q-mt-md"
                >
                  <template #avatar><q-icon name="info" /></template>
                  Select the pay period you are running before importing allowances or deductions.
                </q-banner>

                <q-banner
                  v-else-if="selectedPeriodProcessed"
                  rounded
                  class="bg-grey-2 text-grey-9 q-mt-md"
                >
                  <template #avatar><q-icon name="lock" /></template>
                  This payroll run has been processed. Importing new allowance or deduction rows is disabled.
                </q-banner>

                <q-banner
                  v-if="importParseErrors.length"
                  rounded
                  class="bg-red-1 text-red-9 q-mt-md"
                >
                  <template #avatar><q-icon name="error_outline" /></template>
                  <div class="text-weight-medium">Some rows could not be read</div>
                  <div
                    v-for="message in importParseErrors.slice(0, 5)"
                    :key="message"
                    class="text-caption"
                  >
                    {{ message }}
                  </div>
                  <div v-if="importParseErrors.length > 5" class="text-caption">
                    {{ importParseErrors.length - 5 }} more parsing issue{{ importParseErrors.length - 5 === 1 ? '' : 's' }}.
                  </div>
                </q-banner>

                <q-banner
                  v-if="importPosted"
                  rounded
                  class="bg-green-1 text-green-9 q-mt-md"
                >
                  <template #avatar><q-icon name="task_alt" /></template>
                  This uploaded batch has been posted to the selected payroll run.
                </q-banner>
              </div>

              <div class="col-12 col-lg-7">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <q-card flat bordered class="import-stat-card">
                      <q-card-section>
                        <div class="text-caption text-grey-7">Employees</div>
                        <div class="text-h6 text-weight-bold">{{ importPreview?.employeeCount ?? 0 }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-card flat bordered class="import-stat-card">
                      <q-card-section>
                        <div class="text-caption text-grey-7">Allowances</div>
                        <div class="text-h6 text-positive">{{ formatCurrency(importPreview?.allowanceTotal ?? 0) }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-card flat bordered class="import-stat-card">
                      <q-card-section>
                        <div class="text-caption text-grey-7">Deductions</div>
                        <div class="text-h6 text-negative">{{ formatCurrency(importPreview?.deductionTotal ?? 0) }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <q-table
                  class="q-mt-md import-summary-table"
                  flat
                  bordered
                  dense
                  row-key="employeeIdentifier"
                  title="Import summary by employee"
                  :rows="importPreview?.employees ?? []"
                  :columns="importPreviewColumns"
                  :loading="isImportingFile"
                  :pagination="{ rowsPerPage: 0 }"
                  :rows-per-page-options="[0]"
                  hide-pagination
                >
                  <template #body-cell-employeeName="props">
                    <q-td :props="props">
                      <q-btn
                        flat
                        dense
                        no-caps
                        color="primary"
                        :label="props.row.employeeName || props.row.employeeIdentifier"
                        @click="openImportDetails(props.row)"
                      />
                    </q-td>
                  </template>
                  <template #body-cell-allowanceTotal="props">
                    <q-td :props="props">{{ formatCurrency(props.row.allowanceTotal) }}</q-td>
                  </template>
                  <template #body-cell-deductionTotal="props">
                    <q-td :props="props">{{ formatCurrency(props.row.deductionTotal) }}</q-td>
                  </template>
                  <template #body-cell-errorCount="props">
                    <q-td :props="props">
                      <q-chip
                        dense
                        :color="props.row.errorCount > 0 ? 'red-1' : 'green-1'"
                        :text-color="props.row.errorCount > 0 ? 'negative' : 'positive'"
                        :icon="props.row.errorCount > 0 ? 'error_outline' : 'task_alt'"
                        :label="props.row.errorCount"
                      />
                    </q-td>
                  </template>
                </q-table>

                <div class="row items-center justify-between q-mt-md q-gutter-sm">
                  <q-btn
                    flat
                    color="primary"
                    icon="arrow_back"
                    label="Back to review"
                    @click="goToReviewStep"
                  />
                  <q-btn
                    unelevated
                    color="primary"
                    icon="playlist_add_check"
                    label="Post import"
                    :loading="isImportingFile"
                    :disable="!canPostImport"
                    @click="confirmAllowanceDeductionImport"
                  />
                  <q-btn
                    unelevated
                    color="primary"
                    icon-right="arrow_forward"
                    label="Continue to payroll summary"
                    :disable="!selectedPayPeriodId"
                    @click="goToPayrollSummaryStep"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-step>

      <q-step
        name="summary"
        title="Payroll summary"
        icon="payments"
        :done="payrollStep === 'process'"
      >
        <div class="row items-center justify-between q-col-gutter-md q-mb-md">
          <div class="col-12 col-md">
            <div class="text-h6 text-weight-bold">Employee payroll summary</div>
            <div class="text-body2 text-grey-7">
              Review gross pay, allowances, deductions, taxes, social security, YTD figures, and net pay for this payroll run.
            </div>
          </div>
          <div class="col-12 col-md-auto row q-gutter-sm justify-end">
            <q-btn
              flat
              color="primary"
              icon="arrow_back"
              label="Back to import"
              @click="payrollStep = 'import'"
            />
            <q-btn
              unelevated
              color="primary"
              icon="refresh"
              label="Refresh summary"
              :loading="isLoadingPayrollRunSummary"
              @click="refreshPayrollSummary"
            />
            <q-btn
              unelevated
              color="primary"
              icon-right="arrow_forward"
              label="Continue to process"
              :disable="!selectedPayPeriodId"
              @click="goToProcessStep"
            />
          </div>
        </div>

        <q-card flat bordered class="payroll-run-card">
          <q-card-section>
            <q-table
              class="payroll-summary-table"
              flat
              bordered
              dense
              row-key="employeeId"
              :rows="payrollRunEmployeeSummary?.rows ?? []"
              :columns="payrollSummaryColumns"
              :loading="isLoadingPayrollRunSummary"
              :pagination="{ rowsPerPage: 0 }"
              :rows-per-page-options="[0]"
              hide-pagination
            >
              <template #body-cell-employeeName="props">
                <q-td :props="props">
                  <div class="text-weight-medium">{{ props.row.employeeName || 'Unknown employee' }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.employeeCode || props.row.employeeId }}</div>
                </q-td>
              </template>
              <template
                v-for="columnName in payrollMoneyColumnNames"
                :key="columnName"
                #[`body-cell-${columnName}`]="props"
              >
                <q-td :props="props">{{ formatCurrency(props.value) }}</q-td>
              </template>
              <template #body-cell-overtimeHours="props">
                <q-td :props="props">{{ formatHours(props.value) }}</q-td>
              </template>
              <template #body-cell-holidayHours="props">
                <q-td :props="props">{{ formatHours(props.value) }}</q-td>
              </template>
              <template #body-cell-bankName="props">
                <q-td :props="props">
                  <span v-if="props.row.bankName">{{ props.row.bankName }}</span>
                  <span v-else-if="Number(props.row.netPay) > 0" class="text-negative">Missing</span>
                  <span v-else class="text-grey-6">—</span>
                </q-td>
              </template>
              <template #body-cell-accountNumber="props">
                <q-td :props="props">
                  <span v-if="props.row.accountNumber">{{ props.row.accountNumber }}</span>
                  <span v-else-if="Number(props.row.netPay) > 0" class="text-negative">Missing</span>
                  <span v-else class="text-grey-6">—</span>
                </q-td>
              </template>
              <template #bottom-row>
                <q-tr v-if="payrollRunEmployeeSummary?.totals" class="bg-grey-2 text-weight-bold">
                  <q-td>Totals</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.baseEarnings) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.nonTaxableAllowances) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.deductions) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.employerSocialSecurity) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.employeeSocialSecurity) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.incomeTax) }}</q-td>
                  <q-td class="text-right">{{ formatHours(payrollRunEmployeeSummary.totals.overtimeHours) }}</q-td>
                  <q-td class="text-right">{{ formatHours(payrollRunEmployeeSummary.totals.holidayHours) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.ytdEarnings) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.ytdIncomeTax) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.ytdSocialSecurity) }}</q-td>
                  <q-td class="text-right">{{ formatCurrency(payrollRunEmployeeSummary.totals.netPay) }}</q-td>
                  <q-td />
                  <q-td />
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-step>

      <q-step
        name="process"
        title="Process & payslips"
        icon="task_alt"
      >
        <div class="row items-center justify-between q-col-gutter-md q-mb-md">
          <div class="col-12 col-md">
            <div class="text-h6 text-weight-bold">Process payroll and generate payslips</div>
            <div class="text-body2 text-grey-7">
              Finalize this payroll run, then generate printable payslips for all employees in scope.
            </div>
          </div>
          <div class="col-12 col-md-auto row q-gutter-sm justify-end">
            <q-btn
              flat
              color="primary"
              icon="arrow_back"
              label="Back to summary"
              @click="payrollStep = 'summary'"
            />
          </div>
        </div>

        <q-card flat bordered class="payroll-run-card">
          <q-card-section>
            <q-banner
              v-if="selectedPeriodProcessed"
              rounded
              class="bg-green-1 text-green-9 q-mb-md"
            >
              <template #avatar><q-icon name="task_alt" /></template>
              This payroll run has been processed. You can regenerate payslips at any time.
            </q-banner>

            <q-banner
              v-else
              rounded
              class="bg-blue-1 text-blue-9 q-mb-md"
            >
              <template #avatar><q-icon name="info" /></template>
              Processing will persist payroll records and mark this pay period as posted. This action cannot be undone from this screen.
            </q-banner>

            <div class="text-subtitle2 text-weight-medium q-mb-sm">Payslip sort order</div>
            <q-option-group
              v-model="payslipSort"
              type="radio"
              color="primary"
              :options="payslipSortOptions"
              class="q-mb-lg"
            />

            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-auto">
                <q-btn
                  unelevated
                  color="primary"
                  icon="playlist_add_check"
                  label="Process payroll"
                  :disable="selectedPeriodProcessed || !selectedPayPeriodId"
                  :loading="isProcessingPayrollRun"
                  @click="confirmProcessPayrollRun"
                />
              </div>
              <div class="col-12 col-sm-auto">
                <q-btn
                  outline
                  color="primary"
                  icon="description"
                  label="Generate payslips"
                  :disable="!selectedPayPeriodId || !selectedPeriodProcessed"
                  :loading="isGeneratingPayslips"
                  @click="generatePayslips"
                />
              </div>
            </div>

            <div v-if="payrollRunEmployeeSummary?.rows.length" class="text-caption text-grey-7 q-mt-md">
              {{ payrollRunEmployeeSummary.rows.length }} employees in payroll summary scope.
            </div>
          </q-card-section>
        </q-card>
      </q-step>
    </q-stepper>

    <employee-timesheet-detail-dialog
      :model-value="employeeDetailDialogOpen"
      :summary="selectedEmployeeSummary"
      :details="employeeTimesheetDetails"
      :start-date="timesheetFilter.startDate"
      :end-date="timesheetFilter.endDate"
      :is-loading="isLoadingEmployeeDetails"
      :is-updating-approval="isUpdatingApproval"
      :is-recalculating-compensation="isRecalculatingCompensation"
      @update:model-value="employeeDetailDialogOpen = $event"
      @request-approval="handleApprovalRequest"
      @approve-clean-pending="approveCleanPending"
      @recalculate-compensation="confirmRecalculateSelectedEmployee"
    />

    <timesheet-approval-dialog
      :model-value="approvalDialogOpen"
      :target="approvalTarget"
      :action="approvalAction"
      :remarks="approvalRemarks"
      :is-updating-approval="isUpdatingApproval"
      @update:model-value="onApprovalDialogUpdate"
      @update:remarks="onApprovalRemarksUpdate"
      @submit="submitApproval"
    />

    <q-dialog v-model="importDetailsDialogOpen">
      <q-card class="import-details-dialog">
        <q-card-section class="row items-start justify-between q-col-gutter-md">
          <div class="col">
            <div class="text-h6 text-weight-bold">
              {{ selectedImportEmployee?.employeeName || selectedImportEmployee?.employeeIdentifier || 'Import details' }}
            </div>
            <div class="text-body2 text-grey-7">
              {{ selectedImportEmployee?.recordCount ?? 0 }} records ·
              {{ formatCurrency(selectedImportEmployee?.allowanceTotal ?? 0) }} allowances ·
              {{ formatCurrency(selectedImportEmployee?.deductionTotal ?? 0) }} deductions
            </div>
          </div>
          <div class="col-auto">
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-table
            class="import-details-table"
            flat
            dense
            row-key="rowNumber"
            :rows="selectedImportDetailRows"
            :columns="importDetailColumns"
            :pagination="{ rowsPerPage: 0 }"
            :rows-per-page-options="[0]"
            hide-pagination
          >
            <template #body-cell-employeeIdentifier="props">
              <q-td :props="props">
                <q-input
                  class="import-inline-input"
                  dense
                  outlined
                  :model-value="props.row.employeeIdentifier"
                  :disable="selectedPeriodProcessed || importPosted"
                  @change="void updateImportDetailRow(props.row, { employeeIdentifier: String($event ?? '') })"
                />
              </q-td>
            </template>
            <template #body-cell-employeeName="props">
              <q-td :props="props">
                <q-input
                  class="import-inline-input"
                  dense
                  outlined
                  :model-value="props.row.employeeName"
                  :disable="selectedPeriodProcessed || importPosted"
                  @change="void updateImportDetailRow(props.row, { employeeName: String($event ?? '') || null })"
                />
              </q-td>
            </template>
            <template #body-cell-kind="props">
              <q-td :props="props">
                <q-chip
                  dense
                  :color="props.row.kind === 'deduction' ? 'red-1' : 'green-1'"
                  :text-color="props.row.kind === 'deduction' ? 'negative' : 'positive'"
                  :label="props.row.kind"
                />
              </q-td>
            </template>
            <template #body-cell-code="props">
              <q-td :props="props">
                <q-input
                  class="import-inline-input import-inline-input--code"
                  dense
                  outlined
                  :model-value="props.row.code"
                  :disable="selectedPeriodProcessed || importPosted"
                  @change="void updateImportDetailRow(props.row, { code: String($event ?? '') })"
                />
              </q-td>
            </template>
            <template #body-cell-accountName="props">
              <q-td :props="props">
                <AccountSelect
                  class="import-inline-account"
                  :model-value="props.row.accountId"
                  label="Account"
                  clearable
                  :disable="selectedPeriodProcessed || importPosted"
                  @update:model-value="void updateImportDetailRow(props.row, { accountId: $event })"
                />
              </q-td>
            </template>
            <template #body-cell-date="props">
              <q-td :props="props">
                <SsBenefitDateField
                  class="import-inline-date"
                  :model-value="props.row.date"
                  label="Date"
                  :disable="selectedPeriodProcessed || importPosted"
                  @update:model-value="void updateImportDetailRow(props.row, { date: $event ?? '' })"
                />
              </q-td>
            </template>
            <template #body-cell-quantity="props">
              <q-td :props="props">
                <q-input
                  class="import-inline-number"
                  dense
                  outlined
                  type="number"
                  step="0.01"
                  :model-value="props.row.quantity"
                  :disable="selectedPeriodProcessed || importPosted"
                  @change="void updateImportDetailRow(props.row, { quantity: Number($event) })"
                />
              </q-td>
            </template>
            <template #body-cell-rate="props">
              <q-td :props="props">
                <q-input
                  class="import-inline-number"
                  dense
                  outlined
                  type="number"
                  step="0.01"
                  min="0"
                  :model-value="props.row.rate"
                  :disable="selectedPeriodProcessed || importPosted"
                  @change="void updateImportDetailRow(props.row, { rate: Number($event) })"
                />
              </q-td>
            </template>
            <template #body-cell-amount="props">
              <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
            </template>
            <template #body-cell-errors="props">
              <q-td :props="props">
                <span v-if="!props.row.errors.length" class="text-positive">OK</span>
                <div v-else class="text-negative">
                  <div v-for="message in props.row.errors" :key="message">{{ message }}</div>
                </div>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap q-gutter-xs justify-end">
                  <q-btn
                    flat
                    dense
                    round
                    color="negative"
                    icon="delete"
                    :disable="selectedPeriodProcessed || importPosted"
                    @click="deleteImportRow(props.row)"
                  >
                    <q-tooltip>Remove imported row</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import AttendanceTimesheetsTab from '@payroll/components/attendance/AttendanceTimesheetsTab.vue';
import EmployeeTimesheetDetailDialog from '@payroll/components/attendance/EmployeeTimesheetDetailDialog.vue';
import TimesheetApprovalDialog from '@payroll/components/attendance/TimesheetApprovalDialog.vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import type { TimesheetApprovalAction, TimesheetFilterForm } from '../components/attendance/types';
import {
  useAttendanceStore,
  type EmployeeTimesheetSummary,
  type PayrollAllowanceDeductionImportEmployee,
  type PayrollAllowanceDeductionImportPreview,
  type PayrollAllowanceDeductionImportRow,
  type PayslipSort,
  type TimesheetRow,
} from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import { usePayPeriodScheduleStore } from '@payroll/stores/pay-period-schedule-store';
import { formatDate } from '../components/attendance/utils';

type EditableImportDetailRow = PayrollAllowanceDeductionImportRow & PayrollAllowanceDeductionImportPreview['employees'][number]['details'][number];

const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const payPeriodScheduleStore = usePayPeriodScheduleStore();
const $q = useQuasar();

const {
  employeeTimesheetSummaries,
  employeeTimesheetDetails,
  timesheetSummary,
  employeeSummaryPagination,
  payPeriods,
  payrollRunEmployeeSummary,
  isLoadingEmployeeSummaries,
  isLoadingEmployeeDetails,
  isLoadingPayPeriods,
  isLoadingPayrollRuns,
  isLoadingPayrollRunSummary,
  isProcessingPayrollRun,
  isGeneratingPayslips,
  isImportingFile,
  isUpdatingApproval,
  isRecalculatingCompensation,
  error,
} = storeToRefs(attendanceStore);

const payrollStep = ref<'period' | 'import' | 'review' | 'summary' | 'process'>('period');
const payslipSort = ref<PayslipSort>('last_name');
const payslipSortOptions = [
  { label: 'Last name (A-Z)', value: 'last_name' },
  { label: 'Department, then last name (A-Z)', value: 'department_last_name' },
];
const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayPeriodId = ref<string | null>(null);
const payPeriodEdit = ref({
  startDate: '',
  endDate: '',
  payDate: '',
});

const approvalDialogOpen = ref(false);
const approvalTarget = ref<TimesheetRow | null>(null);
const approvalAction = ref<TimesheetApprovalAction>('APPROVED');
const approvalRemarks = ref('');
const employeeDetailDialogOpen = ref(false);
const selectedEmployeeSummary = ref<EmployeeTimesheetSummary | null>(null);
const importFile = ref<File | null>(null);
const importRows = ref<PayrollAllowanceDeductionImportRow[]>([]);
const importPreview = ref<PayrollAllowanceDeductionImportPreview | null>(null);
const importParseErrors = ref<string[]>([]);
const importPosted = ref(false);
const blankImportAccountId = ref<string | null>(null);
const importDetailsDialogOpen = ref(false);
const selectedImportEmployee = ref<PayrollAllowanceDeductionImportEmployee | null>(null);

const timesheetFilter = ref<TimesheetFilterForm>({
  payPeriodScheduleId: null,
  startDate: '',
  endDate: '',
  approvalStatus: null,
  workingStatus: null,
  payType: null,
  issuesOnly: false,
});

const timesheetLastPage = computed(() =>
  Math.max(
    1,
    Math.ceil(employeeSummaryPagination.value.rowsNumber / employeeSummaryPagination.value.rowsPerPage || 1),
  ),
);
const timesheetIssueCount = computed(() => timesheetSummary.value.issueCount);
const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);
const filteredPayPeriods = computed(() =>
  selectedPayPeriodGroupId.value
    ? payPeriods.value.filter((period) => period.payPeriodGroupId === selectedPayPeriodGroupId.value)
    : [],
);
const selectedPeriod = computed(() =>
  payPeriods.value.find((period) => period.id === selectedPayPeriodId.value) ?? null,
);
const selectedPayrollRunId = computed(() => selectedPeriod.value?.payrollRunId ?? null);
const selectedPeriodProcessed = computed(() =>
  selectedPeriod.value?.payrollRunStatus?.toLowerCase() === 'posted',
);
const selectedPeriodStatusLabel = computed(() => {
  const status = selectedPeriod.value?.payrollRunStatus;

  if (!status) {
    return 'No payroll run';
  }

  return status.toLowerCase() === 'posted' ? 'Processed' : 'Draft payroll run';
});
const payPeriodOptions = computed(() =>
  filteredPayPeriods.value.map((period) => {
    const status = period.payrollRunStatus?.toLowerCase();
    const processed = status === 'posted';
    const statusLabel = processed ? 'Processed' : status === 'draft' ? 'Draft' : 'No run';

    return {
      value: period.id,
      label: `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
      caption: `Pay ${formatDate(period.payDate)} · ${statusLabel}`,
      statusLabel,
      processed,
    };
  }),
);
const canPostImport = computed(() =>
  Boolean(
    selectedPayrollRunId.value
    && importRows.value.length > 0
    && importPreview.value
    && importPreview.value.errorCount === 0
    && !hasUnassignedBlankImportAccounts.value
    && !importPosted.value
    && !selectedPeriodProcessed.value
    && !isImportingFile.value,
  ),
);
const blankImportRowCount = computed(() => importRows.value.filter((row) => row.code.trim() === '').length);
const unassignedBlankImportRowCount = computed(() =>
  importRows.value.filter((row) => row.code.trim() === '' && !row.accountId).length,
);
const hasUnassignedBlankImportAccounts = computed(() =>
  unassignedBlankImportRowCount.value > 0 && !blankImportAccountId.value,
);
const importRowsForPreview = computed(() =>
  importRows.value.map((row) =>
    row.code.trim() === ''
      ? { ...row, accountId: row.accountId ?? blankImportAccountId.value }
      : row,
  ),
);
const selectedImportDetailRows = computed<EditableImportDetailRow[]>(() =>
  (selectedImportEmployee.value?.details ?? []).map((detail) => {
    const rawRow = importRows.value[detail.rowNumber - 1];

    return {
      ...detail,
      employeeIdentifier: rawRow?.employeeIdentifier ?? selectedImportEmployee.value?.employeeIdentifier ?? '',
      employeeName: rawRow?.employeeName ?? selectedImportEmployee.value?.employeeName ?? null,
      code: rawRow?.code ?? detail.code,
      accountId: rawRow?.accountId ?? detail.accountId,
      date: rawRow?.date ?? detail.date,
      quantity: rawRow?.quantity ?? detail.quantity,
      rate: rawRow?.rate ?? detail.rate,
      amount: rawRow?.amount ?? detail.amount,
    };
  }),
);

const importPreviewColumns = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' as const, sortable: true },
  { name: 'recordCount', label: 'Records', field: 'recordCount', align: 'right' as const, sortable: true },
  { name: 'allowanceTotal', label: 'Allowances', field: 'allowanceTotal', align: 'right' as const, sortable: true },
  { name: 'deductionTotal', label: 'Deductions', field: 'deductionTotal', align: 'right' as const, sortable: true },
  { name: 'errorCount', label: 'Errors', field: 'errorCount', align: 'center' as const, sortable: true },
];

const importDetailColumns = [
  { name: 'rowNumber', label: 'Row', field: 'rowNumber', align: 'right' as const, sortable: true },
  { name: 'employeeIdentifier', label: 'Employee ID', field: 'employeeIdentifier', align: 'left' as const, sortable: true },
  { name: 'employeeName', label: 'Employee name', field: 'employeeName', align: 'left' as const, sortable: true },
  { name: 'kind', label: 'Type', field: 'kind', align: 'left' as const, sortable: true },
  { name: 'code', label: 'Code', field: 'code', align: 'left' as const, sortable: true },
  { name: 'date', label: 'Date', field: 'date', align: 'left' as const, sortable: true },
  { name: 'quantity', label: 'Qty', field: 'quantity', align: 'right' as const, sortable: true },
  { name: 'rate', label: 'Rate', field: 'rate', align: 'right' as const, sortable: true },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const, sortable: true },
  { name: 'accountName', label: 'Account override', field: 'accountName', align: 'left' as const, sortable: true },
  { name: 'errors', label: 'Validation', field: 'errors', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

const payrollMoneyColumnNames = [
  'baseEarnings',
  'nonTaxableAllowances',
  'deductions',
  'employerSocialSecurity',
  'employeeSocialSecurity',
  'incomeTax',
  'ytdEarnings',
  'ytdIncomeTax',
  'ytdSocialSecurity',
  'netPay',
];
const payrollSummaryColumns = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' as const, sortable: true },
  { name: 'baseEarnings', label: 'Base pay', field: 'baseEarnings', align: 'right' as const, sortable: true },
  { name: 'nonTaxableAllowances', label: 'Other deductions', field: 'nonTaxableAllowances', align: 'right' as const, sortable: true },
  { name: 'deductions', label: 'Deduction', field: 'deductions', align: 'right' as const, sortable: true },
  { name: 'employerSocialSecurity', label: 'SS employer', field: 'employerSocialSecurity', align: 'right' as const, sortable: true },
  { name: 'employeeSocialSecurity', label: 'SS employee', field: 'employeeSocialSecurity', align: 'right' as const, sortable: true },
  { name: 'incomeTax', label: 'Income tax', field: 'incomeTax', align: 'right' as const, sortable: true },
  { name: 'overtimeHours', label: 'Overtime', field: 'overtimeHours', align: 'right' as const, sortable: true },
  { name: 'holidayHours', label: 'Holidays', field: 'holidayHours', align: 'right' as const, sortable: true },
  { name: 'ytdEarnings', label: 'YTD earnings', field: 'ytdEarnings', align: 'right' as const, sortable: true },
  { name: 'ytdIncomeTax', label: 'YTD income tax', field: 'ytdIncomeTax', align: 'right' as const, sortable: true },
  { name: 'ytdSocialSecurity', label: 'YTD social security', field: 'ytdSocialSecurity', align: 'right' as const, sortable: true },
  { name: 'netPay', label: 'Net pay', field: 'netPay', align: 'right' as const, sortable: true },
  { name: 'bankName', label: 'Bank', field: 'bankName', align: 'left' as const, sortable: true },
  { name: 'accountNumber', label: 'Account', field: 'accountNumber', align: 'left' as const, sortable: true },
];

function onTimesheetFilterUpdate(nextFilter: TimesheetFilterForm) {
  if (nextFilter.payPeriodScheduleId !== timesheetFilter.value.payPeriodScheduleId) {
    selectedPayPeriodId.value = nextFilter.payPeriodScheduleId;
    const period = payPeriods.value.find((item) => item.id === nextFilter.payPeriodScheduleId);
    if (period?.payPeriodGroupId) {
      selectedPayPeriodGroupId.value = period.payPeriodGroupId;
    }
    nextFilter = {
      ...nextFilter,
      startDate: period?.startDate ?? '',
      endDate: period?.endDate ?? '',
    };
  }

  timesheetFilter.value = nextFilter;
}

function syncSelectedPayPeriod(value: string | null) {
  selectedPayPeriodId.value = value;
  const period = payPeriods.value.find((item) => item.id === value);

  if (period) {
    if (period.payPeriodGroupId) {
      selectedPayPeriodGroupId.value = period.payPeriodGroupId;
    }
    payPeriodEdit.value = {
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
    };
    timesheetFilter.value = {
      ...timesheetFilter.value,
      payPeriodScheduleId: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
    };
  } else {
    payPeriodEdit.value = {
      startDate: '',
      endDate: '',
      payDate: '',
    };
  }
}

async function onSelectedPayPeriodGroupUpdate(value: string | null) {
  selectedPayPeriodGroupId.value = value;
  const nextPayPeriodId = resolveDefaultPayPeriodId(value);
  syncSelectedPayPeriod(nextPayPeriodId);
  resetImportPreview();
  attendanceStore.payrollRunEmployeeSummary = null;

  if (payrollStep.value === 'review') {
    await loadTimesheets(1);
  } else if (payrollStep.value === 'summary' || payrollStep.value === 'process') {
    await refreshPayrollSummary();
  }
}

async function onSelectedPayPeriodUpdate(value: string | null) {
  syncSelectedPayPeriod(value);
  resetImportPreview();
  attendanceStore.payrollRunEmployeeSummary = null;
  if (payrollStep.value === 'review') {
    await loadTimesheets(1);
  } else if (payrollStep.value === 'summary' || payrollStep.value === 'process') {
    await refreshPayrollSummary();
  }
}

function onApprovalDialogUpdate(value: boolean) {
  approvalDialogOpen.value = value;
}

function onApprovalRemarksUpdate(value: string) {
  approvalRemarks.value = value;
}

async function loadTimesheets(page = 1) {
  await attendanceStore.fetchEmployeeTimesheetSummaries(timesheetApiFilters(), page);
}

function timesheetApiFilters(employeeId?: string) {
  return {
    startDate: timesheetFilter.value.startDate || undefined,
    endDate: timesheetFilter.value.endDate || undefined,
    employeeId,
    payPeriodGroupId: selectedPayPeriodGroupId.value || undefined,
    approvalStatus: timesheetFilter.value.approvalStatus || undefined,
    workingStatus: timesheetFilter.value.workingStatus || undefined,
    payType: timesheetFilter.value.payType || undefined,
    issuesOnly: timesheetFilter.value.issuesOnly,
  };
}

async function openEmployeeDetails(summary: EmployeeTimesheetSummary) {
  selectedEmployeeSummary.value = summary;
  employeeDetailDialogOpen.value = true;
  await attendanceStore.fetchEmployeeTimesheetDetails(summary.employeeId, {
    ...timesheetApiFilters(),
    employmentDetailId: summary.employmentDetailId ?? undefined,
  });
}

async function reloadEmployeeDetails() {
  if (!selectedEmployeeSummary.value) {
    return;
  }

  await attendanceStore.fetchEmployeeTimesheetDetails(
    selectedEmployeeSummary.value.employeeId,
    {
      ...timesheetApiFilters(),
      employmentDetailId: selectedEmployeeSummary.value.employmentDetailId ?? undefined,
    },
  );
  selectedEmployeeSummary.value =
    employeeTimesheetSummaries.value.find(
      (summary) =>
        summary.employeeId === selectedEmployeeSummary.value?.employeeId
        && summary.employmentDetailId === selectedEmployeeSummary.value?.employmentDetailId,
    ) ?? selectedEmployeeSummary.value;
}

async function applyTimesheetFilter() {
  await loadTimesheets(1);
}

async function savePayPeriod() {
  if (!selectedPayPeriodId.value) {
    return;
  }

  if (!payPeriodEdit.value.startDate || !payPeriodEdit.value.endDate || !payPeriodEdit.value.payDate) {
    $q.notify({ type: 'negative', message: 'Start date, end date, and pay date are required.' });
    return;
  }

  if (payPeriodEdit.value.endDate < payPeriodEdit.value.startDate) {
    $q.notify({ type: 'negative', message: 'End date must be on or after start date.' });
    return;
  }

  const success = await payPeriodScheduleStore.updatePayPeriodSchedule(
    selectedPayPeriodId.value,
    payPeriodEdit.value.startDate,
    payPeriodEdit.value.endDate,
    payPeriodEdit.value.payDate,
  );

  if (!success) {
    $q.notify({
      type: 'negative',
      message: payPeriodScheduleStore.error ?? 'Failed to update pay period.',
    });
    return;
  }

  await attendanceStore.fetchPayrollRuns();
  await attendanceStore.fetchPayPeriods();
  syncSelectedPayPeriod(selectedPayPeriodId.value);
  $q.notify({ type: 'positive', message: 'Pay period updated.' });
}

function goToImportStep() {
  payrollStep.value = 'import';
}

function goToPayrollSummaryStep() {
  payrollStep.value = 'summary';
}

function goToProcessStep() {
  payrollStep.value = 'process';
}

function goToReviewStep() {
  payrollStep.value = 'review';
}

watch(payrollStep, async (step) => {
  if (step === 'review') {
    await loadTimesheets(1);
  } else if (step === 'summary' || step === 'process') {
    await refreshPayrollSummary();
  }
});

async function resetTimesheetFilter() {
  const period = payPeriods.value.find((item) => item.id === selectedPayPeriodId.value);
  timesheetFilter.value = {
    payPeriodScheduleId: period?.id ?? null,
    startDate: period?.startDate ?? '',
    endDate: period?.endDate ?? '',
    approvalStatus: null,
    workingStatus: null,
    payType: null,
    issuesOnly: false,
  };
  await loadTimesheets(1);
}

async function refreshTimesheets() {
  await loadTimesheets(employeeSummaryPagination.value.page);

  if (employeeDetailDialogOpen.value) {
    await reloadEmployeeDetails();
  }
}

function confirmRecalculateAll() {
  $q.dialog({
    title: 'Recalculate all active compensation?',
    message:
      'This refreshes pay type, rates, regular hours, and overtime for all employees with active compensation in the selected pay period. Past payroll periods are not changed.',
    cancel: true,
    ok: {
      label: 'Recalculate all',
      color: 'primary',
      icon: 'calculate',
    },
  }).onOk(() => {
    void recalculateCompensation({ allActiveCompensation: true });
  });
}

function confirmRecalculateSelectedEmployee() {
  if (!selectedEmployeeSummary.value) {
    return;
  }

  $q.dialog({
    title: 'Recalculate employee compensation?',
    message: `Refresh pay type, rates, regular hours, and overtime for ${selectedEmployeeSummary.value.employeeName ?? 'this employee'} in the selected pay period.`,
    cancel: true,
    ok: {
      label: 'Recalculate employee',
      color: 'primary',
      icon: 'calculate',
    },
  }).onOk(() => {
    void recalculateCompensation({ employeeIds: [selectedEmployeeSummary.value!.employeeId] });
  });
}

async function recalculateCompensation(options: {
  employeeIds?: string[];
  allActiveCompensation?: boolean;
}) {
  const result = await attendanceStore.recalculateCompensation({
    ...options,
    startDate: timesheetFilter.value.startDate || undefined,
    endDate: timesheetFilter.value.endDate || undefined,
    payPeriodGroupId: selectedPayPeriodGroupId.value || undefined,
  });

  if (!result) {
    $q.notify({
      type: 'negative',
      message: error.value ?? 'Failed to recalculate compensation.',
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Recalculated ${result.recalculatedTimesheets} timesheet${result.recalculatedTimesheets === 1 ? '' : 's'}.`,
  });

  await refreshTimesheets();
}

async function reviewTimesheetIssues() {
  timesheetFilter.value = {
    ...timesheetFilter.value,
    approvalStatus: 'PENDING',
    issuesOnly: true,
  };

  await loadTimesheets(1);
}

function approveCleanPending(timesheetIds: string[]) {
  if (!timesheetIds.length) {
    return;
  }

  $q.dialog({
    title: 'Approve clean timesheets?',
    message: `${timesheetIds.length} clean pending timesheet${timesheetIds.length === 1 ? '' : 's'} on this page will be approved for payroll.`,
    cancel: true,
    ok: {
      label: `Approve ${timesheetIds.length}`,
      color: 'positive',
      icon: 'done_all',
    },
  }).onOk(() => {
    void submitCleanPendingApproval(timesheetIds);
  });
}

async function submitCleanPendingApproval(timesheetIds: string[]) {
  const result = await attendanceStore.updateBulkTimesheetApproval({
    timesheetIds,
    approvalStatus: 'APPROVED',
  });

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Batch approval failed.' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Approved ${result.updatedCount ?? timesheetIds.length} clean timesheets.`,
  });
  await loadTimesheets(employeeSummaryPagination.value.page);
  await reloadEmployeeDetails();
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BZD',
  }).format(Number.isFinite(value) ? value : 0);
}

function formatHours(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function resetImportPreview() {
  importFile.value = null;
  importRows.value = [];
  importPreview.value = null;
  importParseErrors.value = [];
  importPosted.value = false;
  blankImportAccountId.value = null;
  selectedImportEmployee.value = null;
  importDetailsDialogOpen.value = false;
}

async function refreshPayrollSummary() {
  const payrollRunId = await ensureSelectedPayrollRunId();
  if (!payrollRunId) {
    return;
  }

  const result = await attendanceStore.fetchPayrollRunEmployeeSummary(payrollRunId);
  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to fetch payroll summary.' });
  }
}

function confirmProcessPayrollRun() {
  if (selectedPeriodProcessed.value) {
    return;
  }

  const employeeCount = payrollRunEmployeeSummary.value?.rows.length ?? 0;

  $q.dialog({
    title: 'Process payroll run?',
    message: `This will finalize payroll for ${employeeCount} employee${employeeCount === 1 ? '' : 's'} and mark this pay period as posted.`,
    cancel: true,
    ok: {
      label: 'Process payroll',
      color: 'primary',
      icon: 'playlist_add_check',
    },
  }).onOk(() => {
    void processPayrollRun();
  });
}

async function processPayrollRun() {
  const payrollRunId = await ensureSelectedPayrollRunId();
  if (!payrollRunId) {
    return;
  }

  const result = await attendanceStore.processPayrollRun(payrollRunId);
  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to process payroll run.' });
    return;
  }

  await attendanceStore.fetchPayrollRuns();
  await attendanceStore.fetchPayPeriods();
  syncSelectedPayPeriod(selectedPayPeriodId.value);
  await refreshPayrollSummary();

  $q.notify({
    type: 'positive',
    message: `Processed payroll for ${result.employeeCount} employee${result.employeeCount === 1 ? '' : 's'}.`,
  });
}

async function generatePayslips() {
  const payrollRunId = await ensureSelectedPayrollRunId();
  if (!payrollRunId) {
    return;
  }

  const opened = await attendanceStore.openPayrollRunPayslips(payrollRunId, payslipSort.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to generate payslips.' });
    return;
  }

  $q.notify({ type: 'positive', message: 'Payslips opened in a new tab.' });
}

function cellText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return localDateString(value);
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  return '';
}

function numberCell(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const normalized = String(value).replace(/,/g, '').trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function spreadsheetDate(value: unknown): string | null {
  if (value instanceof Date) {
    return localDateString(value);
  }

  if (typeof value === 'number') {
    const excelDate = new Date(Date.UTC(1899, 11, 30 + Math.floor(value)));
    return [
      String(excelDate.getUTCFullYear()).padStart(4, '0'),
      String(excelDate.getUTCMonth() + 1).padStart(2, '0'),
      String(excelDate.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  const text = cellText(value);
  if (!text) {
    return null;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = slashMatch[1] ?? '';
    const day = slashMatch[2] ?? '';
    const year = slashMatch[3] ?? '';
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : localDateString(date);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseAllowanceDeductionRows(sheetRows: unknown[][]): PayrollAllowanceDeductionImportRow[] {
  const headerIndex = sheetRows.findIndex((row) => {
    const first = cellText(row[0]).toLowerCase();
    const second = cellText(row[1]).toLowerCase();
    return first.includes('id') && second.includes('name');
  });
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 1;
  const parsedRows: PayrollAllowanceDeductionImportRow[] = [];
  const parseErrors: string[] = [];

  for (let rowIndex = startIndex; rowIndex < sheetRows.length; rowIndex++) {
    const row = sheetRows[rowIndex] ?? [];
    const employeeIdentifier = cellText(row[0]);
    const employeeName = cellText(row[1]) || null;

    if (!employeeIdentifier) {
      continue;
    }

    for (let columnIndex = 2; columnIndex < row.length; columnIndex += 4) {
      const code = cellText(row[columnIndex]);
      const date = spreadsheetDate(row[columnIndex + 1]);
      const quantity = numberCell(row[columnIndex + 2]);
      const rate = numberCell(row[columnIndex + 3]);
      const hasAnyValue = Boolean(code || date || quantity !== null || rate !== null);

      if (!hasAnyValue) {
        continue;
      }

      if (!code && date && quantity === null && rate === null) {
        continue;
      }

      const rowLabel = `Row ${rowIndex + 1}, columns ${columnIndex + 1}-${columnIndex + 4}`;
      if (!date || quantity === null || rate === null) {
        parseErrors.push(`${rowLabel}: date, quantity, and rate are required.`);
        continue;
      }

      const amount = roundMoney(Math.abs(quantity) * rate);

      if (amount <= 0) {
        parseErrors.push(`${rowLabel}: amount must be greater than zero.`);
        continue;
      }

      parsedRows.push({
        employeeIdentifier,
        employeeName,
        code,
        date,
        quantity,
        rate,
        amount,
      });
    }
  }

  importParseErrors.value = parseErrors;
  return parsedRows;
}

async function handleImportFile(file: File | null) {
  importFile.value = file;
  importRows.value = [];
  importPreview.value = null;
  importParseErrors.value = [];
  importPosted.value = false;
  blankImportAccountId.value = null;

  if (!file) {
    return;
  }

  const payrollRunId = await ensureSelectedPayrollRunId();
  if (!payrollRunId) {
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('The uploaded workbook does not contain any sheets.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('The first worksheet could not be read.');
    }

    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: true,
      blankrows: false,
      defval: null,
    });
    const rows = rawRows.filter((row): row is unknown[] => Array.isArray(row));
    const parsedRows = parseAllowanceDeductionRows(rows);

    if (parsedRows.length === 0) {
      $q.notify({ type: 'negative', message: 'No allowance or deduction rows were found in the file.' });
      return;
    }

    importRows.value = parsedRows;
    if (blankImportRowCount.value > 0 && !blankImportAccountId.value) {
      $q.notify({
        type: 'warning',
        message: 'Select an account for rows without account codes before previewing.',
      });
      return;
    }

    await previewCurrentImportRows(payrollRunId);
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : 'Failed to read the uploaded file.';
    importParseErrors.value = [message];
    $q.notify({ type: 'negative', message });
  }
}

async function onBlankImportAccountUpdate(accountId: string | null) {
  blankImportAccountId.value = accountId;
  importPreview.value = null;

  if (importRows.value.length === 0 || hasUnassignedBlankImportAccounts.value) {
    return;
  }

  const payrollRunId = await ensureSelectedPayrollRunId();
  if (!payrollRunId) {
    return;
  }

  await previewCurrentImportRows(payrollRunId);
}

async function previewCurrentImportRows(payrollRunId: string, preferredRowNumber: number | null = null) {
  const selectedIdentifier = selectedImportEmployee.value?.employeeIdentifier ?? null;
  importPreview.value = await attendanceStore.previewAllowanceDeductionImport(
    payrollRunId,
    importRowsForPreview.value,
  );

  if (!importPreview.value) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to preview import.' });
    return;
  }

  if (preferredRowNumber !== null) {
    selectedImportEmployee.value =
      importPreview.value.employees.find((employee) =>
        employee.details.some((detail) => detail.rowNumber === preferredRowNumber),
      ) ?? null;
    importDetailsDialogOpen.value = selectedImportEmployee.value !== null;
  } else if (selectedIdentifier) {
    selectedImportEmployee.value =
      importPreview.value.employees.find((employee) => employee.employeeIdentifier === selectedIdentifier) ?? null;
    importDetailsDialogOpen.value = selectedImportEmployee.value !== null;
  }

  if (importPreview.value.errorCount > 0 || importParseErrors.value.length > 0) {
    $q.notify({ type: 'warning', message: 'Review import errors before posting.' });
  } else {
    $q.notify({ type: 'positive', message: `Previewed ${importPreview.value.recordCount} import records.` });
  }
}

function openImportDetails(employee: PayrollAllowanceDeductionImportEmployee) {
  selectedImportEmployee.value = employee;
  importDetailsDialogOpen.value = true;
}

function importRowIndexFromDetail(detail: { rowNumber: number }) {
  const index = detail.rowNumber - 1;

  return index >= 0 && index < importRows.value.length ? index : null;
}

async function updateImportDetailRow(
  detail: { rowNumber: number },
  patch: Partial<PayrollAllowanceDeductionImportRow>,
) {
  const index = importRowIndexFromDetail(detail);
  if (index === null) {
    $q.notify({ type: 'negative', message: 'Imported row could not be found.' });
    return;
  }

  const currentRow = importRows.value[index];
  if (!currentRow) {
    $q.notify({ type: 'negative', message: 'Imported row could not be found.' });
    return;
  }

  const nextRow = {
    ...currentRow,
    ...patch,
  };
  nextRow.employeeIdentifier = nextRow.employeeIdentifier.trim();
  nextRow.employeeName = nextRow.employeeName?.trim() || null;
  nextRow.code = nextRow.code.trim();
  nextRow.quantity = Number(nextRow.quantity);
  nextRow.rate = Number(nextRow.rate ?? 0);
  nextRow.amount = roundMoney(Math.abs(nextRow.quantity) * nextRow.rate);

  if (!nextRow.employeeIdentifier || !nextRow.date || !Number.isFinite(nextRow.quantity) || !Number.isFinite(nextRow.rate)) {
    $q.notify({ type: 'negative', message: 'Employee ID, date, quantity, and rate are required.' });
    return;
  }

  if (nextRow.amount <= 0) {
    $q.notify({ type: 'negative', message: 'Amount must be greater than zero.' });
    return;
  }

  if (JSON.stringify(currentRow) === JSON.stringify(nextRow)) {
    return;
  }

  importRows.value = importRows.value.map((row, rowIndex) =>
    rowIndex === index ? nextRow : row,
  );
  importPosted.value = false;

  const payrollRunId = await ensureSelectedPayrollRunId();
  if (payrollRunId) {
    await previewCurrentImportRows(payrollRunId, detail.rowNumber);
  }
}

function deleteImportRow(detail: { rowNumber: number }) {
  const index = importRowIndexFromDetail(detail);
  if (index === null) {
    $q.notify({ type: 'negative', message: 'Imported row could not be found.' });
    return;
  }

  $q.dialog({
    title: 'Remove imported row?',
    message: 'This removes the row from the staged import preview. It will not be posted.',
    cancel: true,
    ok: {
      label: 'Remove row',
      color: 'negative',
      icon: 'delete',
    },
  }).onOk(() => {
    void removeImportRow(index);
  });
}

async function removeImportRow(index: number) {
  importRows.value = importRows.value.filter((_, rowIndex) => rowIndex !== index);
  importPosted.value = false;

  if (importRows.value.length === 0) {
    importPreview.value = null;
    selectedImportEmployee.value = null;
    importDetailsDialogOpen.value = false;
    return;
  }

  const payrollRunId = await ensureSelectedPayrollRunId();
  if (payrollRunId) {
    await previewCurrentImportRows(payrollRunId);
  }
}

function confirmAllowanceDeductionImport() {
  if (!canPostImport.value) {
    return;
  }

  $q.dialog({
    title: 'Post imported allowances and deductions?',
    message: `This will insert ${importPreview.value?.recordCount ?? importRows.value.length} allowance/deduction records into the selected draft payroll run.`,
    cancel: true,
    ok: {
      label: 'Post import',
      color: 'primary',
      icon: 'playlist_add_check',
    },
  }).onOk(() => {
    void postAllowanceDeductionImport();
  });
}

async function postAllowanceDeductionImport() {
  const payrollRunId = await ensureSelectedPayrollRunId();
  if (!payrollRunId) {
    return;
  }

  const result = await attendanceStore.confirmAllowanceDeductionImport(payrollRunId, importRowsForPreview.value);

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to post import.' });
    return;
  }

  importPreview.value = result;
  importPosted.value = true;
  if (payrollStep.value === 'summary') {
    await refreshPayrollSummary();
  }
  $q.notify({
    type: 'positive',
    message: `Posted ${result.inserted?.total ?? result.recordCount} allowance/deduction records.`,
  });
}

async function ensureSelectedPayrollRunId(): Promise<string | null> {
  if (selectedPayrollRunId.value) {
    return selectedPayrollRunId.value;
  }

  if (!selectedPayPeriodId.value) {
    $q.notify({ type: 'negative', message: 'Select the pay period you are running first.' });
    return null;
  }

  const created = await attendanceStore.createDraftPayrollRun(selectedPayPeriodId.value);
  if (!created) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to create a draft payroll run for this pay period.' });
    return null;
  }

  await attendanceStore.fetchPayPeriods();
  syncSelectedPayPeriod(selectedPayPeriodId.value);
  return created.id;
}

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? payPeriods.value.find((period) => period.payPeriodGroupId)?.payPeriodGroupId
    ?? null;
}

function resolveDefaultPayPeriodId(payPeriodGroupId = selectedPayPeriodGroupId.value): string | null {
  const today = localDateString(new Date());
  const candidates = payPeriodGroupId
    ? payPeriods.value.filter((period) => period.payPeriodGroupId === payPeriodGroupId)
    : payPeriods.value;
  const draftPeriods = candidates
    .filter((period) => period.payrollRunStatus?.toLowerCase() === 'draft')
    .sort((left, right) => left.startDate.localeCompare(right.startDate));

  return draftPeriods.find((period) => period.endDate >= today)?.id
    ?? draftPeriods[0]?.id
    ?? candidates.find((period) => period.startDate <= today && period.endDate >= today)?.id
    ?? candidates[0]?.id
    ?? null;
}

function openApprovalDialog(row: TimesheetRow, action: TimesheetApprovalAction) {
  approvalTarget.value = row;
  approvalAction.value = action;
  approvalRemarks.value = '';
  approvalDialogOpen.value = true;
}

function handleApprovalRequest(payload: { row: TimesheetRow; action: TimesheetApprovalAction }) {
  openApprovalDialog(payload.row, payload.action);
}

async function submitApproval() {
  if (!approvalTarget.value) {
    return;
  }

  const result = await attendanceStore.updateTimesheetApproval(approvalTarget.value.id, {
    approvalStatus: approvalAction.value,
    remarks: approvalRemarks.value.trim() || undefined,
  });

  if (!result) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to update timesheet approval.' });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Timesheet ${approvalAction.value === 'APPROVED' ? 'approved' : 'rejected'}.`,
  });

  approvalDialogOpen.value = false;
  approvalTarget.value = null;
  approvalRemarks.value = '';
  await loadTimesheets(employeeSummaryPagination.value.page);
  await reloadEmployeeDetails();
}

onMounted(async () => {
  await payPeriodGroupStore.fetchPayPeriodGroups(1, 100);
  await attendanceStore.fetchPayrollRuns();
  await attendanceStore.fetchPayPeriods();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  syncSelectedPayPeriod(resolveDefaultPayPeriodId());
});
</script>

<style scoped>
.attendance-page {
  min-height: calc(100vh - 130px);
  max-width: 100%;
  border-radius: 16px;
  background: #f6f8fb;
}

.import-summary-table {
  max-height: 520px;
}

.import-details-dialog {
  width: min(96vw, 1500px);
  max-width: 96vw;
}

.import-details-table {
  max-height: 70vh;
}

.import-inline-input {
  min-width: 150px;
}

.import-inline-input--code {
  min-width: 110px;
}

.import-inline-account {
  min-width: 260px;
}

.import-inline-date {
  min-width: 150px;
}

.import-inline-number {
  min-width: 100px;
}

.payroll-summary-table :deep(.q-table__middle) {
  max-height: 620px;
}

.payroll-summary-table :deep(thead tr) {
  background: #f7f9fc;
}

.payroll-summary-table :deep(th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f7f9fc;
}
</style>
