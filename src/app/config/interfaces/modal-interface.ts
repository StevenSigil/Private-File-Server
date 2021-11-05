export interface ConfirmationModal {
  headerText: string | undefined;
  bodyContent: string | undefined;
  confirmBtnText: string | undefined;
  cancelBtnText: string | undefined;
  isShowing: boolean;
  data: any;
}
